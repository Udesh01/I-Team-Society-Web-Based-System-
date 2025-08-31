# Manual Testing Checklist: Profile Phone Number Updates

## Test Objective
Verify that profile updates work with arbitrary phone values (`abc`, `123-xyz`, empty) and confirm the profile saves without errors in UI, network requests, and database.

## Pre-Test Setup
1. ✅ Start the development server: `npm run dev`
2. ✅ Ensure application is accessible at http://localhost:8081
3. ✅ Have a user account ready for testing
4. ✅ Have browser developer tools open for network monitoring

## Test Cases

### Test Case 1: Text Value "abc"
**Steps:**
1. Navigate to Profile page
2. Click "Edit Profile" 
3. Clear phone number field
4. Enter: `abc`
5. Click "Save"

**Expected Results:**
- ✅ UI accepts input without validation errors
- ✅ Save button works (not disabled)
- ✅ Success toast message appears
- ✅ Network request completes successfully (200 status)
- ✅ Phone field shows "abc" after save
- ✅ Database stores "abc" exactly as entered

**Verification:**
- [ ] No JavaScript errors in console
- [ ] Network tab shows successful PUT/PATCH request
- [ ] Profile UI updates immediately
- [ ] Page refresh shows "abc" in phone field

---

### Test Case 2: Mixed Format "123-xyz"
**Steps:**
1. Navigate to Profile page  
2. Click "Edit Profile"
3. Clear phone number field
4. Enter: `123-xyz`
5. Click "Save"

**Expected Results:**
- ✅ UI accepts input without validation errors
- ✅ Save button works (not disabled)
- ✅ Success toast message appears  
- ✅ Network request completes successfully (200 status)
- ✅ Phone field shows "123-xyz" after save
- ✅ Database stores "123-xyz" exactly as entered

**Verification:**
- [ ] No JavaScript errors in console
- [ ] Network tab shows successful PUT/PATCH request
- [ ] Profile UI updates immediately
- [ ] Page refresh shows "123-xyz" in phone field

---

### Test Case 3: Empty Value ""
**Steps:**
1. Navigate to Profile page
2. Click "Edit Profile" 
3. Clear phone number field completely (empty string)
4. Click "Save"

**Expected Results:**
- ✅ UI accepts empty input
- ✅ Save button works (not disabled)
- ✅ Success toast message appears
- ✅ Network request completes successfully (200 status) 
- ✅ Phone field shows "Not provided" after save
- ✅ Database stores NULL or empty string

**Verification:**
- [ ] No JavaScript errors in console
- [ ] Network tab shows successful PUT/PATCH request
- [ ] Profile UI shows "Not provided" text
- [ ] Page refresh shows empty/not provided state

---

### Additional Edge Cases (Bonus Testing)

#### Test Case 4: Special Characters
- Input: `!@#$%^&*()`
- Expected: Saves successfully without errors

#### Test Case 5: Emoji 
- Input: `📞 call me`
- Expected: Saves successfully without errors

#### Test Case 6: Long Text
- Input: `this is a very long phone number text that exceeds normal length`
- Expected: Saves successfully (or truncated if maxLength applied)

#### Test Case 7: Whitespace Only
- Input: `          ` (spaces only)
- Expected: Saves as NULL after trimming

---

## Network Request Verification

### Check Network Requests:
1. Open Browser Developer Tools (F12)
2. Go to Network tab
3. Perform each test case above
4. Look for requests to `/profiles` or similar endpoint

### Expected Network Behavior:
- ✅ HTTP method: PUT or PATCH
- ✅ Status code: 200 (Success)
- ✅ Request payload contains phone_number field
- ✅ Response indicates successful update
- ✅ No 400/422 validation errors
- ✅ No 500 server errors

### Sample Request Payload:
```json
{
  "first_name": "Test",
  "last_name": "User", 
  "phone_number": "abc",  // Raw value as entered
  "address": "Some address",
  "updated_at": "2024-01-01T12:00:00.000Z"
}
```

---

## Database Verification

### SQL Queries to Run:
```sql
-- Check profile table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'phone_number';

-- View current profile data
SELECT id, first_name, last_name, phone_number, updated_at 
FROM profiles 
WHERE id = 'your-user-id-here'
ORDER BY updated_at DESC;

-- Check phone number values after each test
SELECT phone_number, updated_at
FROM profiles 
WHERE id = 'your-user-id-here'
ORDER BY updated_at DESC
LIMIT 5;
```

### Expected Database Behavior:
- ✅ `phone_number` column allows NULL values
- ✅ `phone_number` column is TEXT/VARCHAR type
- ✅ Values stored exactly as entered (no formatting)
- ✅ Empty strings may become NULL (depends on implementation)
- ✅ Special characters and emojis stored correctly
- ✅ `updated_at` timestamp updates with each change

---

## Error Scenarios to Verify Are NOT Present

### These should NOT happen:
- ❌ Phone validation error messages
- ❌ Form submission blocked due to phone format
- ❌ JavaScript errors about invalid phone numbers
- ❌ Network 422 validation errors
- ❌ Database constraint violations
- ❌ Phone number formatting/transformation
- ❌ Required field errors for phone (unless explicitly required)

---

## Test Results Recording

### Test Case 1: "abc"
- [ ] UI accepts input: ✅/❌
- [ ] Save successful: ✅/❌  
- [ ] Network request OK: ✅/❌
- [ ] Database stored correctly: ✅/❌
- [ ] No errors: ✅/❌

### Test Case 2: "123-xyz" 
- [ ] UI accepts input: ✅/❌
- [ ] Save successful: ✅/❌
- [ ] Network request OK: ✅/❌ 
- [ ] Database stored correctly: ✅/❌
- [ ] No errors: ✅/❌

### Test Case 3: Empty ""
- [ ] UI accepts input: ✅/❌
- [ ] Save successful: ✅/❌
- [ ] Network request OK: ✅/❌
- [ ] Database stored correctly: ✅/❌
- [ ] No errors: ✅/❌

## Final Verification

### Summary Checklist:
- [ ] All test phone values save without errors
- [ ] No validation blocks form submission  
- [ ] UI remains responsive and functional
- [ ] Network requests succeed for all formats
- [ ] Database stores raw values correctly
- [ ] No JavaScript console errors
- [ ] Profile updates work end-to-end

### Success Criteria:
✅ **PASS**: All arbitrary phone formats save successfully  
❌ **FAIL**: Any phone format blocks form submission or causes errors

---

## Notes & Observations:
_Record any unexpected behavior, edge cases, or areas for improvement:_

- 
- 
- 

## Testing Completed By:
**Name:** ________________  
**Date:** ________________  
**Environment:** ________________  

## Test Result:
- [ ] ✅ **PASSED** - All phone formats work correctly
- [ ] ❌ **FAILED** - Issues found (describe below)

**Issues Found:**
_List any problems encountered during testing:_

- 
- 
-
