/**
 * Form validation utilities that ensure phone numbers are passed as raw strings
 * without any format validation to prevent submission blocking.
 */

export interface FormData {
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

/**
 * Validates basic form fields but explicitly DOES NOT validate phone number format.
 * This ensures that any phone number format (international, local, with/without spaces, etc.)
 * can be submitted without blocking the form submission.
 */
export const validateFormSubmission = (formData: FormData, requiredFields: string[] = []): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check only required fields (phone is typically optional and never validated for format)
  for (const field of requiredFields) {
    if (!formData[field] || (typeof formData[field] === 'string' && !formData[field]?.trim())) {
      errors.push(`${field} is required`);
    }
  }

  // Email format validation (if provided and required)
  if (formData.email && requiredFields.includes('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
  }

  // IMPORTANT: No phone number validation - phone numbers are accepted in any format
  // This prevents form submission blocking due to phone format issues

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Prepares form data for submission, ensuring phone numbers are passed as-is
 * without any formatting or validation.
 */
export const prepareFormDataForSubmission = (formData: FormData): FormData => {
  const cleanedData = { ...formData };

  // Trim whitespace from string fields (except phone which should remain unchanged)
  Object.keys(cleanedData).forEach(key => {
    if (typeof cleanedData[key] === 'string' && key !== 'phone') {
      cleanedData[key] = cleanedData[key]?.trim();
    }
  });

  // Phone number is passed as raw string - no processing, no validation, no formatting
  // This ensures backend receives exactly what user typed
  if (cleanedData.phone !== undefined) {
    // Keep phone exactly as entered by user
    cleanedData.phone = formData.phone || null;
  }

  return cleanedData;
};

/**
 * Validates that phone number handling in forms follows the no-validation principle.
 * This is a utility to ensure developers don't accidentally add phone validation.
 */
export const verifyPhoneHandling = (phoneValue: string | null | undefined): boolean => {
  // Phone handling is correct if:
  // 1. It accepts any string value
  // 2. It accepts null/undefined
  // 3. It doesn't throw errors for any format
  
  try {
    // Test that phone value can be stored without validation
    const testData = prepareFormDataForSubmission({ phone: phoneValue });
    return testData.phone === phoneValue; // Should be unchanged
  } catch (error) {
    // If any error is thrown, phone handling is incorrect
    return false;
  }
};

// Test cases to verify phone handling works correctly
export const phoneHandlingTestCases = [
  "+1-234-567-8900",
  "1234567890",
  "+94 11 288 1000",
  "011-2881000",
  "+1 (234) 567-8900",
  "invalid phone",
  "123",
  "+",
  "",
  null,
  undefined
];

/**
 * Runs verification tests to ensure phone numbers are handled correctly
 * across all form submission scenarios.
 */
export const runPhoneHandlingVerification = (): { passed: boolean; results: any[] } => {
  const results = phoneHandlingTestCases.map(testCase => {
    const passed = verifyPhoneHandling(testCase);
    return {
      input: testCase,
      passed,
      output: prepareFormDataForSubmission({ phone: testCase }).phone
    };
  });

  const allPassed = results.every(result => result.passed);
  
  if (!allPassed) {
    console.warn('Phone handling verification failed for some test cases:', 
                 results.filter(r => !r.passed));
  }

  return {
    passed: allPassed,
    results
  };
};
