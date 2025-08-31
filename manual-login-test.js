/**
 * Manual Login Redirect Issue Reproduction Script
 * 
 * This script helps reproduce and document the login redirect loop issue
 * that occurs when user roles become NULL during authentication.
 */

const testConfig = {
  baseUrl: 'http://localhost:8081',
  testUsers: [
    {
      email: 'admin@iteam.com',
      password: 'password123',
      expectedRole: 'admin',
      expectedRedirect: '/dashboard/admin/modern'
    },
    {
      email: 'staff@iteam.com', 
      password: 'password123',
      expectedRole: 'staff',
      expectedRedirect: '/dashboard/modern-staff'
    },
    {
      email: 'student@iteam.com',
      password: 'password123', 
      expectedRole: 'student',
      expectedRedirect: '/dashboard/modern-student'
    }
  ]
};

// Helper function to wait for element
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkElement() {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        return;
      }
      
      setTimeout(checkElement, 100);
    }
    
    checkElement();
  });
}

// Function to monitor network requests
function setupNetworkMonitoring() {
  const networkLogs = [];
  
  // Override fetch to monitor API calls
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const startTime = Date.now();
    const url = args[0];
    
    console.log(`🌐 NETWORK: ${url}`, args);
    
    try {
      const response = await originalFetch.apply(this, args);
      const endTime = Date.now();
      
      // Clone response to read body without consuming it
      const clonedResponse = response.clone();
      let body = null;
      
      try {
        body = await clonedResponse.json();
      } catch (e) {
        // Not JSON, that's okay
      }
      
      const logEntry = {
        url,
        method: args[1]?.method || 'GET',
        status: response.status,
        duration: endTime - startTime,
        response: body,
        timestamp: new Date().toISOString()
      };
      
      networkLogs.push(logEntry);
      
      // Check for role-related API calls
      if (url.includes('/profiles') || url.includes('/auth')) {
        console.log('🎭 ROLE-RELATED API CALL:', logEntry);
        
        if (body && body.role === null) {
          console.error('🔴 NULL ROLE DETECTED IN API RESPONSE:', logEntry);
        }
      }
      
      return response;
    } catch (error) {
      const endTime = Date.now();
      const logEntry = {
        url,
        method: args[1]?.method || 'GET',
        error: error.message,
        duration: endTime - startTime,
        timestamp: new Date().toISOString()
      };
      
      networkLogs.push(logEntry);
      console.error('❌ NETWORK ERROR:', logEntry);
      throw error;
    }
  };
  
  // Store logs globally for inspection
  window.__networkLogs = networkLogs;
  
  return networkLogs;
}

// Function to monitor authentication state changes
function setupAuthMonitoring() {
  const authLogs = [];
  
  // Monitor localStorage changes
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (key.includes('supabase') || key.includes('auth')) {
      const logEntry = {
        type: 'localStorage.setItem',
        key,
        value: key.includes('token') ? '[TOKEN]' : value,
        timestamp: new Date().toISOString()
      };
      authLogs.push(logEntry);
      console.log('🔐 AUTH STORAGE:', logEntry);
    }
    return originalSetItem.apply(this, arguments);
  };
  
  // Monitor sessionStorage changes  
  const originalSessionSetItem = sessionStorage.setItem;
  sessionStorage.setItem = function(key, value) {
    if (key.includes('supabase') || key.includes('auth')) {
      const logEntry = {
        type: 'sessionStorage.setItem',
        key,
        value: key.includes('token') ? '[TOKEN]' : value,
        timestamp: new Date().toISOString()
      };
      authLogs.push(logEntry);
      console.log('🔐 AUTH STORAGE:', logEntry);
    }
    return originalSessionSetItem.apply(this, arguments);
  };
  
  window.__authLogs = authLogs;
  return authLogs;
}

// Function to capture console logs
function setupConsoleMonitoring() {
  const consoleLogs = [];
  
  ['log', 'warn', 'error', 'debug'].forEach(level => {
    const original = console[level];
    console[level] = function(...args) {
      const message = args.join(' ');
      
      if (message.includes('role') || message.includes('auth') || message.includes('redirect')) {
        const logEntry = {
          level,
          message,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        };
        consoleLogs.push(logEntry);
        
        if (message.includes('NULL') || message.includes('null')) {
          console.error('🔴 POTENTIAL NULL ROLE ISSUE:', logEntry);
        }
      }
      
      return original.apply(this, args);
    };
  });
  
  window.__consoleLogs = consoleLogs;
  return consoleLogs;
}

// Main test function
async function runLoginTest(userConfig) {
  console.log(`🧪 Starting login test for ${userConfig.email}`);
  
  try {
    // Navigate to login page
    window.location.href = `${testConfig.baseUrl}/login`;
    
    // Wait for login form
    await waitForElement('[data-testid="email-input"]');
    console.log('✅ Login form loaded');
    
    // Fill in credentials
    const emailInput = document.querySelector('[data-testid="email-input"]');
    const passwordInput = document.querySelector('[data-testid="password-input"]');
    const submitButton = document.querySelector('[data-testid="login-submit"]');
    
    emailInput.value = userConfig.email;
    passwordInput.value = userConfig.password;
    
    // Trigger input events
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log(`📝 Filled credentials for ${userConfig.email}`);
    
    // Submit the form
    submitButton.click();
    console.log('📤 Login form submitted');
    
    // Wait for redirect (or error)
    try {
      // Check for successful login by looking for user role element
      await waitForElement('[data-testid="user-role"]', 15000);
      
      const roleElement = document.querySelector('[data-testid="user-role"]');
      const displayedRole = roleElement ? roleElement.textContent : 'NOT FOUND';
      
      console.log(`🎭 User role displayed: "${displayedRole}"`);
      
      // Check if role matches expected
      if (displayedRole.includes(userConfig.expectedRole)) {
        console.log('✅ PASS: Role matches expected');
      } else {
        console.error(`❌ FAIL: Expected role "${userConfig.expectedRole}", got "${displayedRole}"`);
      }
      
      // Check current URL
      const currentUrl = window.location.pathname;
      console.log(`🔗 Current URL: ${currentUrl}`);
      
      if (currentUrl === userConfig.expectedRedirect) {
        console.log('✅ PASS: Redirected to expected URL');
      } else {
        console.error(`❌ FAIL: Expected redirect to "${userConfig.expectedRedirect}", got "${currentUrl}"`);
      }
      
      // Check for redirect loop indicators
      if (currentUrl === '/login') {
        console.error('🔴 CRITICAL: Stuck on login page - possible redirect loop!');
      }
      
    } catch (error) {
      console.error('❌ FAIL: Timeout waiting for successful login', error);
      
      // Check if we're stuck in a redirect loop
      const currentUrl = window.location.pathname;
      if (currentUrl === '/login') {
        console.error('🔴 CRITICAL: Redirect loop detected - stuck on login page');
      }
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  }
}

// Function to run all tests
async function runAllTests() {
  console.log('🏁 Starting comprehensive login redirect test suite');
  
  // Setup monitoring
  const networkLogs = setupNetworkMonitoring();
  const authLogs = setupAuthMonitoring();
  const consoleLogs = setupConsoleMonitoring();
  
  // Run tests for each user
  for (const userConfig of testConfig.testUsers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TESTING USER: ${userConfig.email} (${userConfig.expectedRole})`);
    console.log('='.repeat(60));
    
    await runLoginTest(userConfig);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear auth state between tests
    localStorage.clear();
    sessionStorage.clear();
  }
  
  // Generate test report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST REPORT SUMMARY');
  console.log('='.repeat(60));
  
  console.log('🌐 Network Logs:', networkLogs.length, 'requests');
  console.log('🔐 Auth Logs:', authLogs.length, 'events');  
  console.log('📝 Console Logs:', consoleLogs.length, 'messages');
  
  // Look for null role issues in network logs
  const nullRoleIssues = networkLogs.filter(log => 
    log.response && log.response.role === null
  );
  
  if (nullRoleIssues.length > 0) {
    console.error('🔴 NULL ROLE ISSUES DETECTED:', nullRoleIssues.length);
    nullRoleIssues.forEach(issue => {
      console.error('  -', issue.url, issue.response);
    });
  }
  
  // Store complete test results
  window.__testResults = {
    networkLogs,
    authLogs,
    consoleLogs,
    nullRoleIssues,
    timestamp: new Date().toISOString()
  };
  
  console.log('\n✅ Test complete. Results stored in window.__testResults');
  console.log('📋 To view detailed logs, check: window.__networkLogs, window.__authLogs, window.__consoleLogs');
}

// Export functions for manual testing
window.loginTest = {
  runAllTests,
  runLoginTest,
  setupNetworkMonitoring,
  setupAuthMonitoring,
  setupConsoleMonitoring,
  testConfig
};

console.log('🚀 Login redirect test suite loaded!');
console.log('👉 Run: loginTest.runAllTests() to start comprehensive testing');
console.log('👉 Or: loginTest.runLoginTest(loginTest.testConfig.testUsers[0]) for single user test');
