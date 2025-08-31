describe('Role == NULL Bug Reproduction', () => {
  let roleLogs: string[] = []

  beforeEach(() => {
    // Clear any existing auth state
    cy.clearAllCookies()
    cy.clearAllLocalStorage()
    cy.clearAllSessionStorage()
    
    // Setup console log capturing
    cy.captureRoleLogs()
    
    // Reset role logs array
    roleLogs = []
  })

  afterEach(() => {
    // Collect and log captured role logs
    cy.window().then((win) => {
      const logs = (win as any).__cypressRoleLogs || []
      cy.log('Role-related logs captured:', logs.join('\n'))
      
      // Write logs to file for analysis
      cy.writeFile('cypress/logs/role-logs.txt', logs.join('\n'), { flag: 'a+' })
    })
  })

  describe('Long-lived Session Scenarios', () => {
    it('should maintain role after tab idle and reactivation', () => {
      // Test case 1: Tab idle scenario
      
      // Step 1: Login with valid credentials
      cy.visit('/login')
      cy.get('[data-testid="email-input"]', { timeout: 10000 })
        .should('be.visible')
        .type('admin@iteam.com')
      
      cy.get('[data-testid="password-input"]')
        .should('be.visible')
        .type('password123')
      
      cy.get('[data-testid="login-submit"]')
        .should('be.visible')
        .click()

      // Step 2: Verify successful login and role is set
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-role"]', { timeout: 15000 })
        .should('be.visible')
        .and('contain.text', 'admin')

      // Step 3: Capture initial role state
      cy.window().then((win) => {
        const authContext = (win as any).__authContext
        cy.log('Initial auth state:', JSON.stringify(authContext))
      })

      // Step 4: Simulate tab going idle for 30 minutes
      cy.log('Simulating tab idle for 30 minutes...')
      cy.simulateTabIdle(1800) // 30 minutes in seconds

      // Step 5: Check if role is still present after idle
      cy.get('[data-testid="user-role"]')
        .should('be.visible')
        .then(($el) => {
          const roleText = $el.text()
          if (roleText.includes('null') || roleText === '' || roleText.includes('undefined')) {
            cy.log('❌ ROLE_NULL_BUG: Role became NULL after tab idle!')
            
            // Capture detailed state for debugging
            cy.window().then((win) => {
              const logs = (win as any).__cypressRoleLogs || []
              cy.log('Role logs during idle:', logs.join('\n'))
              
              // Take screenshot for evidence
              cy.screenshot('role-null-after-idle')
            })
          } else {
            cy.log('✅ Role maintained after tab idle:', roleText)
          }
        })
    })

    it('should maintain role after hard refresh', () => {
      // Test case 2: Hard refresh scenario
      
      // Step 1: Login and verify role
      cy.visit('/login')
      cy.get('[data-testid="email-input"]', { timeout: 10000 })
        .type('admin@iteam.com')
      cy.get('[data-testid="password-input"]')
        .type('password123')
      cy.get('[data-testid="login-submit"]')
        .click()
      
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-role"]', { timeout: 15000 })
        .should('contain.text', 'admin')

      // Step 2: Wait for session to be established
      cy.wait(3000)

      // Step 3: Perform hard refresh
      cy.log('Performing hard refresh...')
      cy.reload(true) // Force reload from server

      // Step 4: Check role after refresh
      cy.get('[data-testid="user-role"]', { timeout: 20000 })
        .should('be.visible')
        .then(($el) => {
          const roleText = $el.text()
          if (roleText.includes('null') || roleText === '' || roleText.includes('undefined')) {
            cy.log('❌ ROLE_NULL_BUG: Role became NULL after hard refresh!')
            cy.screenshot('role-null-after-refresh')
            
            // Check console logs for clues
            cy.window().then((win) => {
              const logs = (win as any).__cypressRoleLogs || []
              cy.log('Role logs during refresh:', logs.join('\n'))
            })
          } else {
            cy.log('✅ Role maintained after hard refresh:', roleText)
          }
        })
    })

    it('should maintain role with multiple tabs open', () => {
      // Test case 3: Multiple tabs scenario
      
      // Step 1: Login in first tab
      cy.visit('/login')
      cy.get('[data-testid="email-input"]', { timeout: 10000 })
        .type('admin@iteam.com')
      cy.get('[data-testid="password-input"]')
        .type('password123')
      cy.get('[data-testid="login-submit"]')
        .click()
      
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-role"]', { timeout: 15000 })
        .should('contain.text', 'admin')

      // Step 2: Open multiple new tabs with the same application
      cy.window().then((win) => {
        // Open second tab
        const tab2 = win.open('/dashboard', '_blank')
        
        // Open third tab  
        const tab3 = win.open('/dashboard/profile', '_blank')
        
        // Store tab references
        ;(win as any).__testTabs = [tab2, tab3]
      })

      // Step 3: Wait for tabs to load and simulate activity
      cy.wait(5000)

      // Step 4: Switch focus between tabs
      cy.window().then((win) => {
        const tabs = (win as any).__testTabs || []
        
        // Simulate switching to different tabs
        tabs.forEach((tab: any, index: number) => {
          if (tab && !tab.closed) {
            cy.log(`Switching focus to tab ${index + 2}`)
            tab.focus()
            cy.wait(1000)
          }
        })
      })

      // Step 5: Return to original tab and check role
      cy.window().then((win) => {
        win.focus()
      })
      
      cy.get('[data-testid="user-role"]')
        .should('be.visible')
        .then(($el) => {
          const roleText = $el.text()
          if (roleText.includes('null') || roleText === '' || roleText.includes('undefined')) {
            cy.log('❌ ROLE_NULL_BUG: Role became NULL with multiple tabs!')
            cy.screenshot('role-null-multiple-tabs')
            
            cy.window().then((win) => {
              const logs = (win as any).__cypressRoleLogs || []
              cy.log('Role logs with multiple tabs:', logs.join('\n'))
            })
          } else {
            cy.log('✅ Role maintained with multiple tabs:', roleText)
          }
        })

      // Step 6: Close additional tabs
      cy.window().then((win) => {
        const tabs = (win as any).__testTabs || []
        tabs.forEach((tab: any) => {
          if (tab && !tab.closed) {
            tab.close()
          }
        })
      })
    })

    it('should maintain role during extended session with network issues', () => {
      // Test case 4: Network instability scenario
      
      // Step 1: Login
      cy.visit('/login')
      cy.get('[data-testid="email-input"]', { timeout: 10000 })
        .type('admin@iteam.com')
      cy.get('[data-testid="password-input"]')
        .type('password123')
      cy.get('[data-testid="login-submit"]')
        .click()
      
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-role"]', { timeout: 15000 })
        .should('contain.text', 'admin')

      // Step 2: Simulate network interruption
      cy.log('Simulating network interruption...')
      
      // Intercept and delay Supabase requests to simulate slow network
      cy.intercept('POST', '**/auth/v1/**', (req) => {
        req.reply((res) => {
          // Delay the response by 5 seconds
          setTimeout(() => res.send(), 5000)
        })
      }).as('authRequest')
      
      cy.intercept('GET', '**/rest/v1/profiles**', (req) => {
        req.reply((res) => {
          setTimeout(() => res.send(), 3000)
        })
      }).as('profileRequest')

      // Step 3: Navigate to different pages to trigger auth checks
      cy.get('[data-testid="profile-link"]', { timeout: 5000 })
        .should('be.visible')
        .click()
      
      cy.wait(2000)
      
      cy.get('[data-testid="dashboard-link"]', { timeout: 5000 })
        .should('be.visible')
        .click()

      // Step 4: Check role after network delays
      cy.get('[data-testid="user-role"]', { timeout: 20000 })
        .should('be.visible')
        .then(($el) => {
          const roleText = $el.text()
          if (roleText.includes('null') || roleText === '' || roleText.includes('undefined')) {
            cy.log('❌ ROLE_NULL_BUG: Role became NULL during network issues!')
            cy.screenshot('role-null-network-issues')
            
            cy.window().then((win) => {
              const logs = (win as any).__cypressRoleLogs || []
              cy.log('Role logs during network issues:', logs.join('\n'))
            })
          } else {
            cy.log('✅ Role maintained during network issues:', roleText)
          }
        })
    })

    it('should track role state transitions in session storage', () => {
      // Test case 5: Session storage monitoring
      
      // Step 1: Login and monitor session storage
      cy.visit('/login')
      cy.get('[data-testid="email-input"]', { timeout: 10000 })
        .type('admin@iteam.com')
      cy.get('[data-testid="password-input"]')
        .type('password123')
      cy.get('[data-testid="login-submit"]')
        .click()
      
      cy.url().should('include', '/dashboard')

      // Step 2: Monitor session storage for auth data
      cy.window().then((win) => {
        const sessionData = win.sessionStorage.getItem('supabase.auth.token')
        const localStorage = win.localStorage.getItem('supabase.auth.token')
        
        cy.log('Session storage auth token:', sessionData ? 'Present' : 'Missing')
        cy.log('Local storage auth token:', localStorage ? 'Present' : 'Missing')
        
        // Store initial state
        ;(win as any).__initialAuthState = {
          sessionStorage: sessionData,
          localStorage: localStorage,
          timestamp: Date.now()
        }
      })

      // Step 3: Perform actions that might affect session
      cy.simulateLongSession(60) // 1 hour
      
      // Step 4: Check session storage after long session
      cy.window().then((win) => {
        const newSessionData = win.sessionStorage.getItem('supabase.auth.token')
        const newLocalStorage = win.localStorage.getItem('supabase.auth.token')
        const initialState = (win as any).__initialAuthState
        
        cy.log('After long session:')
        cy.log('Session storage auth token:', newSessionData ? 'Present' : 'Missing')
        cy.log('Local storage auth token:', newLocalStorage ? 'Present' : 'Missing')
        
        if (initialState.sessionStorage && !newSessionData) {
          cy.log('❌ Session storage lost during long session!')
        }
        if (initialState.localStorage && !newLocalStorage) {
          cy.log('❌ Local storage lost during long session!')
        }
      })

      // Step 5: Final role check
      cy.get('[data-testid="user-role"]', { timeout: 10000 })
        .should('be.visible')
        .then(($el) => {
          const roleText = $el.text()
          if (roleText.includes('null') || roleText === '' || roleText.includes('undefined')) {
            cy.log('❌ ROLE_NULL_BUG: Role became NULL during session tracking!')
            cy.screenshot('role-null-session-tracking')
          } else {
            cy.log('✅ Role maintained during session tracking:', roleText)
          }
        })
    })
  })

  describe('API /me Endpoint Monitoring', () => {
    it('should monitor /me endpoint calls and responses', () => {
      // Intercept potential /me endpoint calls
      cy.intercept('GET', '**/auth/v1/user', {}).as('getMeUser')
      cy.intercept('GET', '**/rest/v1/profiles**', {}).as('getProfile')
      
      // Login
      cy.visit('/login')
      cy.get('[data-testid="email-input"]', { timeout: 10000 })
        .type('admin@iteam.com')
      cy.get('[data-testid="password-input"]')
        .type('password123')
      cy.get('[data-testid="login-submit"]')
        .click()
      
      cy.url().should('include', '/dashboard')

      // Wait and monitor API calls
      cy.wait('@getProfile', { timeout: 15000 }).then((interception) => {
        cy.log('Profile API Response:', JSON.stringify(interception.response?.body))
        
        if (interception.response?.body?.role === null) {
          cy.log('❌ ROLE_NULL_BUG: API returned null role!')
          cy.screenshot('api-null-role-response')
        }
      })

      // Simulate session refresh and monitor API calls
      cy.window().then((win) => {
        // Trigger a manual auth refresh
        win.location.reload()
      })
      
      cy.wait('@getProfile', { timeout: 15000 }).then((interception) => {
        cy.log('Profile API Response after refresh:', JSON.stringify(interception.response?.body))
        
        if (interception.response?.body?.role === null) {
          cy.log('❌ ROLE_NULL_BUG: API returned null role after refresh!')
          cy.screenshot('api-null-role-after-refresh')
        }
      })
    })
  })
})
