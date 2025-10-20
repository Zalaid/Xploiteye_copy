"""
📋 REQUEST/RESPONSE SCHEMAS - API Data Validation

This file defines what data format our API endpoints expect and return.

THINK OF IT AS:
  - Contract between frontend and backend
  - Input/Output specification for each API endpoint
  - Automatic data validation before processing
  - API documentation generator

WHY USE PYDANTIC SCHEMAS?
  1. ✅ Validation: Automatically rejects invalid data
  2. ✅ Type Safety: Catches bugs during development
  3. ✅ Documentation: FastAPI auto-generates docs from these
  4. ✅ Serialization: Easy JSON ↔ Python object conversion
  5. ✅ IDE Support: Better autocomplete and hints

EXAMPLE FLOW:
  Frontend sends JSON → Pydantic validates → Python object → Process
                     ↓ If invalid
                     Returns 422 error automatically ✅

WITHOUT SCHEMAS:
  ❌ Manual validation everywhere
  ❌ Bugs from typos in field names
  ❌ No automatic documentation
  ❌ Hard to maintain

WITH SCHEMAS:
  ✅ One place to define data structure
  ✅ Automatic validation
  ✅ Auto-generated API docs
  ✅ Easy to maintain
"""

# ==============================================================================
# IMPORTS
# ==============================================================================

from pydantic import BaseModel, Field, EmailStr, validator
# BaseModel: Base class for all Pydantic models
# Field: Add validation rules and metadata
# EmailStr: Validates email format
# validator: Custom validation functions

from typing import Optional, Dict, Any
# Optional: Field can be None
# Dict: Dictionary type
# Any: Any type (flexible)

from datetime import datetime
# For timestamp fields

import re
# For regex pattern matching (mobile number validation)


# ==============================================================================
# SCHEMA 1: CUSTOMER INFO
# ==============================================================================

class CustomerInfo(BaseModel):
    """
    👤 Customer Information Schema

    This schema defines customer data collected on the checkout page.

    WHEN USED:
      - Embedded in PaymentInitiateRequest
      - Frontend collects this data on checkout form

    WHAT FRONTEND SENDS:
      {
          "customerName": "Zalaid Butt",
          "customerMobile": "03001234567"
      }

    VALIDATION:
      - Name: 2-100 characters
      - Mobile: Pakistani format only

    NOTE: Email is NOT collected here!
      We get email from authenticated user's account (more secure)
    """

    # --------------------------------------------------------------------------
    # FIELD 1: Customer Name
    # --------------------------------------------------------------------------

    customerName: str = Field(..., min_length=2, max_length=100)
    """
    Customer's full name

    Args:
        ...: Required field (cannot be None)
        min_length=2: At least 2 characters
        max_length=100: At most 100 characters

    Valid Examples:
        ✅ "Zalaid Butt"
        ✅ "Muhammad Ali Khan"
        ✅ "Jo" (2 chars)

    Invalid Examples:
        ❌ "A" (too short)
        ❌ "" (empty)
        ❌ None (required)
        ❌ "a" * 101 (too long)

    FastAPI automatically returns 422 error for invalid data:
    {
        "detail": [
            {
                "loc": ["body", "customerInfo", "customerName"],
                "msg": "ensure this value has at least 2 characters",
                "type": "value_error.any_str.min_length"
            }
        ]
    }
    """

    # --------------------------------------------------------------------------
    # FIELD 2: Customer Mobile Number
    # --------------------------------------------------------------------------

    customerMobile: str = Field(..., min_length=11, max_length=15)
    """
    Customer's mobile number (Pakistani format)

    Args:
        ...: Required field
        min_length=11: At least 11 chars ("03001234567")
        max_length=15: At most 15 chars ("+923001234567")

    Validated by @validator below for Pakistani format

    Valid Examples:
        ✅ "03001234567"
        ✅ "+923001234567"
        ✅ "923001234567"

    Invalid Examples:
        ❌ "3001234567" (missing 0)
        ❌ "04001234567" (landline, not mobile)
        ❌ "1234567890" (not Pakistani)
    """

    # --------------------------------------------------------------------------
    # CUSTOM VALIDATOR: Pakistani Mobile Number
    # --------------------------------------------------------------------------

    @validator('customerMobile')
    def validate_mobile(cls, v):
        """
        🔍 Custom Validator for Pakistani Mobile Numbers

        This function runs AFTER basic validation (min/max length)
        and BEFORE creating the CustomerInfo object.

        Pakistani mobile numbers:
          - Start with 03 (if without country code)
          - Start with +92 or 92 (if with country code)
          - Next digit must be 0-9
          - Total of 10 digits after the 3

        Pattern Explanation:
          ^              Start of string
          (\+92|0)?      Optional: +92 or 0
          3              Must have 3 (mobile indicator)
          [0-9]{9}       Exactly 9 more digits
          $              End of string

        Args:
            cls: Class (CustomerInfo)
            v: Value to validate (mobile number string)

        Returns:
            Validated mobile number (unchanged)

        Raises:
            ValueError: If format is invalid

        Examples:
            validate_mobile("03001234567")
            → "03001234567" ✅

            validate_mobile("+923001234567")
            → "+923001234567" ✅

            validate_mobile("923001234567")
            → "923001234567" ✅

            validate_mobile("04001234567")
            → ValueError ❌ (starts with 04, not 03)

            validate_mobile("3001234567")
            → ValueError ❌ (missing 0)
        """
        # Regex pattern for Pakistani mobile
        pattern = r'^(\+92|0)?3[0-9]{9}$'

        # Check if matches pattern
        if not re.match(pattern, v):
            # Raise error with custom message
            raise ValueError('Invalid Pakistani mobile number format')

        # Return validated value
        return v


# ==============================================================================
# SCHEMA 2: PAYMENT INITIATE REQUEST
# ==============================================================================

class PaymentInitiateRequest(BaseModel):
    """
    💳 Payment Initiation Request Schema

    This is what frontend sends when user clicks "Proceed to Secure Payment".

    API ENDPOINT:
      POST /api/payfast/initiate

    REQUEST EXAMPLE:
      {
          "plan": "starter",
          "billingCycle": "monthly",
          "amount": 1000,
          "customerInfo": {
              "customerName": "Zalaid Butt",
              "customerMobile": "03001234567"
          }
      }

    FRONTEND CODE:
      const response = await fetch('/api/payfast/initiate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
              plan: 'starter',
              billingCycle: 'monthly',
              amount: 1000,
              customerInfo: {
                  customerName: 'Zalaid Butt',
                  customerMobile: '03001234567'
              }
          })
      });

    VALIDATION:
      ✅ plan must be: starter, professional, or enterprise
      ✅ billingCycle must be: monthly or annual
      ✅ amount must be > 0
      ✅ customerInfo must pass CustomerInfo validation
    """

    # --------------------------------------------------------------------------
    # FIELD 1: Plan Name
    # --------------------------------------------------------------------------

    plan: str = Field(..., pattern="^(starter|professional|enterprise)$")
    """
    Subscription plan user selected

    Args:
        ...: Required
        pattern: Must match regex pattern

    Valid Values:
        ✅ "starter"
        ✅ "professional"
        ✅ "enterprise"

    Invalid Values:
        ❌ "basic" (not in allowed list)
        ❌ "Starter" (case sensitive!)
        ❌ "pro" (use "professional")
        ❌ "" (empty)
        ❌ None

    Why Case Sensitive?
      - Consistent database queries
      - Prevent duplicate plans (Starter vs starter)
      - Better error messages

    Error Response for Invalid:
      {
          "detail": [
              {
                  "loc": ["body", "plan"],
                  "msg": "string does not match regex",
                  "type": "value_error.str.regex"
              }
          ]
      }
    """

    # --------------------------------------------------------------------------
    # FIELD 2: Billing Cycle
    # --------------------------------------------------------------------------

    billingCycle: str = Field(..., pattern="^(monthly|annual)$")
    """
    Billing frequency

    Args:
        ...: Required
        pattern: Must be "monthly" or "annual"

    Valid Values:
        ✅ "monthly"
        ✅ "annual"

    Invalid Values:
        ❌ "yearly" (use "annual")
        ❌ "Monthly" (case sensitive!)
        ❌ "week" (not supported)

    Why These Two Only?
      - Simple pricing model
      - Easy to calculate end dates
      - Common in SaaS businesses

    Usage in Code:
      if billing_cycle == "monthly":
          end_date = start_date + timedelta(days=30)
      else:  # annual
          end_date = start_date + timedelta(days=365)
    """

    # --------------------------------------------------------------------------
    # FIELD 3: Amount
    # --------------------------------------------------------------------------

    amount: float = Field(..., gt=0)
    """
    Transaction amount in PKR

    Args:
        ...: Required
        gt=0: Greater than 0 (must be positive)

    Valid Examples:
        ✅ 1000 (PKR 1,000)
        ✅ 1500.50 (PKR 1,500.50)
        ✅ 0.01 (PKR 0.01)

    Invalid Examples:
        ❌ 0 (must be > 0)
        ❌ -100 (negative)
        ❌ None

    Why Float?
      - Support decimal amounts (PKR 1,500.50)
      - Discounts can result in decimals
      - More flexible pricing

    IMPORTANT VALIDATION:
      This amount MUST match the plan pricing!
      We validate this in service layer:

      plan_prices = {
          "starter": {"monthly": 1000, "annual": 8000},
          "professional": {"monthly": 1500, "annual": 5000}
      }

      If frontend sends:
        plan="starter", billingCycle="monthly", amount=999
        → Backend rejects: "Invalid amount for selected plan"

    Why Not Auto-Calculate Amount?
      - Frontend might apply discounts
      - Promotional pricing
      - Enterprise custom pricing
      - But we still validate it matches plan!
    """

    # --------------------------------------------------------------------------
    # FIELD 4: Customer Info
    # --------------------------------------------------------------------------

    customerInfo: CustomerInfo
    """
    Customer information (name, mobile)

    Type: CustomerInfo schema (defined above)

    This is a nested schema, meaning customerInfo must contain:
      - customerName (2-100 chars)
      - customerMobile (Pakistani format)

    Pydantic automatically validates the nested object!

    Valid Example:
      {
          "customerName": "Zalaid Butt",
          "customerMobile": "03001234567"
      }

    Invalid Examples:
      ❌ {"customerName": "A"}  (name too short)
      ❌ {"customerMobile": "123"}  (invalid format)
      ❌ {}  (missing required fields)

    Why Nested Schema?
      - Organize related fields
      - Reusable in other endpoints
      - Better validation error messages
      - Cleaner code structure
    """


# ==============================================================================
# SCHEMA 3: PAYMENT INITIATE RESPONSE
# ==============================================================================

class PaymentInitiateResponse(BaseModel):
    """
    💳 Payment Initiation Response Schema

    This is what backend returns after POST /api/payfast/initiate.

    🔄 COMPLETE FLOW EXPLAINED:

    ┌─────────────────────────────────────────────────────────────┐
    │ STEP 1: User clicks "Pay Now" on frontend                  │
    │ ─────────────────────────────────────────                   │
    │ Frontend sends POST /api/payfast/initiate                   │
    │ {                                                           │
    │   "plan": "starter",                                        │
    │   "billingCycle": "monthly",                                │
    │   "amount": 1000,                                           │
    │   "customerInfo": {...}                                     │
    │ }                                                           │
    └─────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ STEP 2: Backend processes                                   │
    │ ─────────────────────────────────────                       │
    │ • Validates amount                                          │
    │ • Generates basket_id                                       │
    │ • Calls PayFast API to get ACCESS_TOKEN                     │
    │ • Saves transaction to DB (status: "initiated")             │
    │ • Builds PayFast form data                                  │
    └─────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ STEP 3: Backend returns THIS response                       │
    │ ─────────────────────────────────────────                   │
    │ (This is PaymentInitiateResponse)                           │
    └─────────────────────────────────────────────────────────────┘

    TWO POSSIBLE RESPONSES:

    ✅ SUCCESS RESPONSE:
      {
          "success": true,
          "message": "Payment initiated successfully",
          "paymentForm": {                              ← 🎯 KEY!
              "action": "https://ipguat.apps.net.pk/...",  ← Where to POST
              "fields": {                                   ← Form fields
                  "MERCHANT_ID": "102",
                  "MERCHANT_NAME": "XploitEye",
                  "TOKEN": "abc123xyz789...",          ← From PayFast API
                  "PROCCODE": "00",
                  "TXNAMT": "1000",
                  "CUSTOMER_MOBILE_NO": "03001234567",
                  "CUSTOMER_EMAIL_ADDRESS": "user@example.com",
                  "BASKET_ID": "ORDER-20241215143027-XYZ789",
                  "SIGNATURE": "random-string",
                  "VERSION": "XPLOITEYE-1.0",
                  "SUCCESS_URL": "http://localhost:3000/payment/success",
                  "FAILURE_URL": "http://localhost:3000/payment/failure",
                  "CHECKOUT_URL": "http://localhost:3000/api/payfast/webhook",
                  ... (total ~20 fields)
              }
          },
          "basketId": "ORDER-20241215143027-XYZ789"   ← For tracking
      }

    ❌ ERROR RESPONSE:
      {
          "success": false,
          "message": "Failed to initiate payment",
          "error": "Invalid amount for selected plan"
      }

    🎯 WHAT HAPPENS NEXT (Frontend's Job):

      const data = await response.json();

      if (data.success && data.paymentForm) {
          // ✅ Success! We have PayFast form data

          // Create HTML form
          const form = document.createElement('form');
          form.action = data.paymentForm.action;  // PayFast URL
          form.method = 'POST';

          // Add all fields as hidden inputs
          Object.keys(data.paymentForm.fields).forEach(key => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = data.paymentForm.fields[key];
              form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();  // 🚀 Redirect user to PayFast payment page!
      } else {
          // ❌ Error! Show message to user
          alert(data.error || data.message);
      }

    🔍 WHY THIS STRUCTURE?

      Q: Why not just redirect user directly?
      A: Because we need to POST data (TOKEN, etc.) to PayFast securely!

      Q: What is paymentForm.action?
      A: The PayFast URL where we submit the payment form
         Example: https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction

      Q: What is paymentForm.fields?
      A: All the data PayFast needs:
         • TOKEN - access token from PayFast
         • MERCHANT_ID - our PayFast merchant ID
         • BASKET_ID - our unique order ID
         • CUSTOMER info, URLs, etc.

      Q: Why so many fields?
      A: PayFast requires all these to process payment securely!

    💡 THINK OF IT LIKE:

      Backend says to Frontend:
      "Here's a pre-filled form. Just submit it to PayFast for me!"

      Frontend:
      "Got it! Creating form... submitting... user is now on PayFast page!"
    """

    # --------------------------------------------------------------------------
    # FIELD 1: Success Flag
    # --------------------------------------------------------------------------

    success: bool
    """
    Whether payment initiation succeeded

    Values:
      - True: Payment initiated, paymentForm contains data
      - False: Failed, error field contains reason

    Usage:
      if response.success:
          # Proceed to PayFast
      else:
          # Show error to user
    """

    # --------------------------------------------------------------------------
    # FIELD 2: Message
    # --------------------------------------------------------------------------

    message: str
    """
    Human-readable message

    Examples:
      - "Payment initiated successfully"
      - "Failed to initiate payment"
      - "Payment token obtained"

    Always present, even for errors
    """

    # --------------------------------------------------------------------------
    # FIELD 3: Payment Form (Optional, only on success)
    # --------------------------------------------------------------------------

    paymentForm: Optional[Dict[str, Any]] = None
    """
    PayFast form data (only present if success=True)

    Structure:
      {
          "action": "https://...",  # URL to submit form to
          "fields": {               # All form fields
              "MERCHANT_ID": "102",
              "TOKEN": "...",
              ... (15 mandatory fields)
          }
      }

    None if:
      - Failed to get access token
      - Amount validation failed
      - Any error occurred

    Frontend uses this to:
      1. Create HTML form
      2. Add all fields as hidden inputs
      3. Submit form (redirects user to PayFast)
    """

    # --------------------------------------------------------------------------
    # FIELD 4: Basket ID (Optional, only on success)
    # --------------------------------------------------------------------------

    basketId: Optional[str] = None
    """
    Unique order ID we generated

    Example: "ORDER-20241215143027-XYZ789"

    Used for:
      - Tracking this payment
      - Webhook verification
      - Customer support

    None if payment initiation failed
    """

    # --------------------------------------------------------------------------
    # FIELD 5: Error (Optional, only on failure)
    # --------------------------------------------------------------------------

    error: Optional[str] = None
    """
    Detailed error message (only if success=False)

    Examples:
      - "Invalid amount for selected plan"
      - "Failed to get payment token"
      - "User not authenticated"
      - "Missing required fields"

    None if successful

    Shown to user on error:
      "Payment failed: {error}"
    """


# ==============================================================================
# SCHEMA 4: PAYMENT VERIFY REQUEST
# ==============================================================================

class PaymentVerifyRequest(BaseModel):
    """
    ✅ Payment Verification Request Schema

    This is what frontend sends to verify payment after PayFast redirect.

    🔄 COMPLETE FLOW EXPLAINED:

    ┌─────────────────────────────────────────────────────────────┐
    │ STEP 1: User completes payment on PayFast                   │
    │ ─────────────────────────────────────────                   │
    │ • User enters card/account details on PayFast page          │
    │ • Clicks "Pay"                                              │
    │ • PayFast processes payment                                 │
    └─────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ STEP 2: PayFast redirects user back to our site             │
    │ ─────────────────────────────────────────                   │
    │ If Success:                                                 │
    │   Redirect to: /payment/success?                            │
    │     transaction_id=PF-2024121514302890123&                  │
    │     basket_id=ORDER-20241215143027-XYZ789&                  │
    │     err_code=000&                                           │
    │     validation_hash=e8192a7554dd699975adf...                │
    │                                                             │
    │ If Failed:                  
                                    │
    │   Redirect to: /payment/failure?                            │
    │     err_code=104&err_msg=Incorrect+details&...              │
    └─────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ STEP 3: Frontend on /payment/success page                   │
    │ ─────────────────────────────────────────                   │
    │ const params = new URLSearchParams(window.location.search); │
    │ const data = {                                              │
    │     transaction_id: params.get('transaction_id'),           │
    │     basket_id: params.get('basket_id'),                     │
    │     err_code: params.get('err_code'),                       │
    │     validation_hash: params.get('validation_hash')          │
    │ };                                                          │
    │                                                             │
    │ // Optional: Verify payment before showing success          │
    │ const response = await fetch('/api/payfast/verify', {       │
    │     method: 'POST',                                         │
    │     body: JSON.stringify(data)                              │
    │ });                                                         │
    └─────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ STEP 4: Backend verifies (routes.py verify_payment)         │
    │ ─────────────────────────────────────────────               │
    │ • Calculate our own validation_hash                         │
    │ • Compare with validation_hash from URL                     │
    │ • Find transaction in database                              │
    │ • Check if belongs to current user                          │
    │ • Return payment details                                    │
    └─────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │ STEP 5: Frontend shows result                               │
    │ ─────────────────────────────────────────                   │
    │ if (response.verified) {                                    │
    │     // ✅ Payment is genuine!                               │
    │     showSuccessMessage();                                   │
    │     redirectToDashboard();                                  │
    │ } else {                                                    │
    │     // ❌ Something's wrong!                                │
    │     showError('Payment verification failed');               │
    │ }                                                           │
    └─────────────────────────────────────────────────────────────┘

    📍 IMPORTANT: Three Communication Channels!

      ┌─────────────────────────────────────────────────────────┐
      │ Channel 1: WEBHOOK (PRIMARY SOURCE OF TRUTH)            │
      │ ──────────────────────────────────────                  │
      │ PayFast → Our Backend (POST /api/payfast/webhook)       │
      │ • Happens in background                                 │
      │ • Creates subscription automatically                    │
      │ • User never sees this                                  │
      │ • THIS is what actually activates subscription!         │
      └─────────────────────────────────────────────────────────┘

      ┌─────────────────────────────────────────────────────────┐
      │ Channel 2: SUCCESS REDIRECT (USER UI)                   │
      │ ──────────────────────────────────────                  │
      │ PayFast → Frontend (/payment/success?...)               │
      │ • User sees this                                        │
      │ • Shows success page                                    │
      │ • But could be manipulated!                             │
      └─────────────────────────────────────────────────────────┘

      ┌─────────────────────────────────────────────────────────┐
      │ Channel 3: VERIFY ENDPOINT (OPTIONAL SECURITY)          │
      │ ──────────────────────────────────────                  │
      │ Frontend → Our Backend (POST /api/payfast/verify)       │
      │ • THIS endpoint! (PaymentVerifyRequest)                 │
      │ • Verifies URL params before showing success            │
      │ • Prevents showing fake success to users                │
      └─────────────────────────────────────────────────────────┘

    🎯 WHY USE THIS ENDPOINT?

      Q: Isn't webhook enough?
      A: Webhook activates subscription, but user needs IMMEDIATE feedback!
         Webhook might take a few seconds. This endpoint gives instant UI feedback.

      Q: Can't we just trust URL parameters?
      A: NO! User could manually type:
         /payment/success?transaction_id=fake&err_code=000
         This endpoint prevents that by verifying validation_hash!

      Q: What does verification do?
      A:
         1. Recalculate validation_hash on backend
         2. Compare with hash from URL
         3. If match: payment is real ✅
         4. If mismatch: someone is faking ❌

      Q: When should frontend call this?
      A: On /payment/success page, BEFORE showing "Payment Successful!"
         This ensures we only show success for real payments.

    🔒 SECURITY: How validation_hash Works

      PayFast calculates:
        hash = SHA256(basket_id + "|" + secured_key + "|" + merchant_id + "|" + err_code)

      We calculate the same:
        our_hash = SHA256(basket_id + "|" + secured_key + "|" + merchant_id + "|" + err_code)

      If our_hash == validation_hash from URL:
        → PayFast generated this URL (genuine) ✅
      Else:
        → Someone manipulated the URL (fake) ❌

    💡 REAL WORLD EXAMPLE:

      ❌ WITHOUT THIS ENDPOINT:
        User: *manually types* /payment/success?err_code=000
        Frontend: "Payment Successful!" ← WRONG! They didn't pay!

      ✅ WITH THIS ENDPOINT:
        User: *manually types* /payment/success?err_code=000
        Frontend: *calls verify endpoint*
        Backend: "validation_hash missing/invalid!"
        Frontend: "Payment verification failed" ← Correct!

    📝 REQUEST EXAMPLE:
      POST /api/payfast/verify
      {
          "transaction_id": "PF-2024121514302890123",
          "basket_id": "ORDER-20241215143027-XYZ789",
          "err_code": "000",
          "validation_hash": "e8192a7554dd699975adf39619c703a49239..."
      }
    """

    # --------------------------------------------------------------------------
    # FIELD 1: Transaction ID (Required)
    # --------------------------------------------------------------------------

    transaction_id: str
    """
    PayFast transaction ID from URL parameter

    Example: "PF-2024121514302890123"

    Source: PayFast includes this in success/failure redirect URL

    Used for:
      - Finding transaction in database
      - Verifying it matches our records
      - Customer support reference
    """

    # --------------------------------------------------------------------------
    # FIELD 2: Basket ID (Required)
    # --------------------------------------------------------------------------

    basket_id: str
    """
    Our unique order ID from URL parameter

    Example: "ORDER-20241215143027-XYZ789"

    Source: This is the basket_id WE generated and sent to PayFast
            PayFast returns it in redirect URL

    Used for:
      - Finding transaction in our database
      - Part of validation_hash calculation
      - Linking payment to user's order
    """

    # --------------------------------------------------------------------------
    # FIELD 3: Error Code (Required)
    # --------------------------------------------------------------------------

    err_code: str
    """
    Payment status code from PayFast

    Values:
      - "000" or "00": Payment successful ✅
      - "002": Transaction timeout
      - "104": Incorrect details
      - "55": Invalid OTP/PIN
      - ... (see PayFast docs for all codes)

    Source: PayFast includes this in redirect URL

    Used for:
      - Determining if payment succeeded
      - Part of validation_hash calculation
      - Showing appropriate message to user
    """

    # --------------------------------------------------------------------------
    # FIELD 4: Validation Hash (Required)
    # --------------------------------------------------------------------------

    validation_hash: str
    """
    Security hash from PayFast (CRITICAL FOR SECURITY!)

    Example: "e8192a7554dd699975adf39619c703a49239..."

    How it's calculated:
      hash = SHA256(basket_id + "|" + secured_key + "|" + merchant_id + "|" + err_code)

    Backend verification process:
      1. Get secured_key from environment (.env)
      2. Calculate: our_hash = SHA256(basket_id|secured_key|merchant_id|err_code)
      3. Compare: our_hash == validation_hash?
      4. If YES: Payment is genuine (PayFast generated this URL) ✅
      5. If NO: Someone manipulated URL parameters ❌

    WHY THIS IS IMPORTANT:
      Without validation_hash verification:
        ❌ Anyone could type /payment/success?err_code=000
        ❌ They'd see success page without paying!

      With validation_hash verification:
        ✅ Only PayFast knows secured_key
        ✅ Only PayFast can generate valid hash
        ✅ Tampering with URL breaks the hash
    """

    # --------------------------------------------------------------------------
    # FIELD 5: Payment Name (Optional)
    # --------------------------------------------------------------------------

    PaymentName: Optional[str] = None
    """
    Payment method user selected (optional)

    Values:
      - "account": Bank account payment
      - "card": Credit/Debit card payment
      - "wallet": Mobile wallet payment

    This is optional in the verify request but may be included
    in the redirect URL by PayFast.

    Used for:
      - Analytics (which payment method is popular?)
      - User payment history
    """

    # --------------------------------------------------------------------------
    # FIELD 6: Transaction Amount (Optional)
    # --------------------------------------------------------------------------

    transaction_amount: Optional[str] = None
    """
    Amount paid (optional)

    Example: "1000"

    Note: This is a string from PayFast, not a number

    Used for:
      - Double-checking amount matches our records
      - Additional verification layer
    """

    # --------------------------------------------------------------------------
    # FIELD 7: Transaction Currency (Optional)
    # --------------------------------------------------------------------------

    transaction_currency: Optional[str] = None
    """
    Currency code (optional)

    Example: "PKR"

    Used for:
      - Verification (should always be PKR for Pakistan)
    """


# ==============================================================================
# SCHEMA 5: PAYMENT VERIFY RESPONSE
# ==============================================================================

class PaymentVerifyResponse(BaseModel):
    """
    ✅ Payment Verification Response Schema

    This is what backend returns after POST /api/payfast/verify.

    🔄 WHEN IS THIS USED?

    After user lands on /payment/success page and frontend calls verify endpoint.

    ┌─────────────────────────────────────────────────────────────┐
    │ Timeline of Events:                                         │
    │ ──────────────────────────────────────                      │
    │                                                             │
    │ 1. User pays on PayFast ✅                                  │
    │ 2. PayFast redirects → /payment/success?transaction_id=... │
    │ 3. Frontend extracts URL params                             │
    │ 4. Frontend calls POST /api/payfast/verify ← HERE!          │
    │ 5. Backend returns THIS response                            │
    │ 6. Frontend shows success/error based on response           │
    └─────────────────────────────────────────────────────────────┘

    📍 TWO POSSIBLE RESPONSES:

    ✅ SUCCESS RESPONSE (verified = true):
      {
          "verified": true,
          "message": "Payment verified successfully",
          "payment": {
              "transaction_id": "PF-2024121514302890123",
              "basket_id": "ORDER-20241215143027-XYZ789",
              "amount": 1000,
              "status": "completed",
              "plan_name": "starter",
              "created_at": "2024-12-15T14:30:27"
          }
      }

      When does this happen?
        ✅ validation_hash in URL matches our calculation
        ✅ Transaction found in database
        ✅ Transaction belongs to current user
        ✅ Payment is genuine!

    ❌ FAILURE RESPONSE (verified = false):
      {
          "verified": false,
          "message": "Payment verification failed"
      }

      When does this happen?
        ❌ validation_hash doesn't match (URL was tampered)
        ❌ Transaction not found in database
        ❌ Transaction belongs to different user
        ❌ Payment is NOT genuine!

    🎯 WHAT DOES FRONTEND DO WITH THIS?

      Example frontend code:

      const verifyPayment = async () => {
          const params = new URLSearchParams(window.location.search);

          const response = await fetch('/api/payfast/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  transaction_id: params.get('transaction_id'),
                  basket_id: params.get('basket_id'),
                  err_code: params.get('err_code'),
                  validation_hash: params.get('validation_hash')
              })
          });

          const data = await response.json();

          if (data.verified && data.payment) {
              // ✅ PAYMENT IS GENUINE!
              setPaymentStatus('success');
              setPaymentDetails(data.payment);

              // Show success message
              showNotification(
                  'Payment Successful!',
                  `Subscribed to ${data.payment.plan_name} plan`
              );

              // Redirect to dashboard after 3 seconds
              setTimeout(() => {
                  router.push('/dashboard');
              }, 3000);

          } else {
              // ❌ PAYMENT VERIFICATION FAILED!
              setPaymentStatus('failed');

              // Show error message
              showNotification(
                  'Verification Failed',
                  data.message || 'Payment could not be verified'
              );

              // Redirect back to pricing page
              setTimeout(() => {
                  router.push('/pricing');
              }, 3000);
          }
      };

    🔒 RELATIONSHIP TO WEBHOOK:

      IMPORTANT: This endpoint provides INSTANT UI feedback, but webhook is the
      source of truth that actually creates the subscription!

      ┌─────────────────────────────────────────────────────────┐
      │ VERIFY ENDPOINT (This Response)                         │
      │ ──────────────────────────────────────                  │
      │ Purpose: Quick UI feedback                              │
      │ Speed: Instant (user calls it)                          │
      │ Action: Just returns status                             │
      │ UI: Shows success/failure page                          │
      └─────────────────────────────────────────────────────────┘

      ┌─────────────────────────────────────────────────────────┐
      │ WEBHOOK (Background Process)                            │
      │ ──────────────────────────────────────                  │
      │ Purpose: Actually activate subscription                 │
      │ Speed: May take few seconds                             │
      │ Action: Creates subscription in database                │
      │ UI: User doesn't see this                               │
      └─────────────────────────────────────────────────────────┘

      Think of it like:
        - Verify Endpoint = "Yes, this payment looks real!"
        - Webhook = "Okay, I've activated the subscription now!"

    💡 REAL WORLD SCENARIOS:

      Scenario 1: Normal Payment ✅
        1. User pays successfully
        2. Verify endpoint: verified=true
        3. Webhook: Creates subscription
        4. User sees success, gets features

      Scenario 2: Malicious User Trying to Fake Payment ❌
        1. User types: /payment/success?err_code=000
        2. Verify endpoint: verified=false (no valid hash)
        3. Frontend: Shows "Verification failed"
        4. User doesn't get features

      Scenario 3: Webhook Delayed ⏰
        1. User pays successfully
        2. Verify endpoint: verified=true (instant)
        3. User sees success page immediately
        4. Webhook: Arrives 5 seconds later, creates subscription
        5. User gets features after webhook processes

      Scenario 4: Transaction Not Found ❓
        1. User has fake/expired transaction_id
        2. Verify endpoint: verified=false
        3. Frontend: Shows error
        4. User redirected to pricing

    🎓 KEY INSIGHTS:

      1. verified=true means URL params are authentic (hash matches)
      2. verified=false means URL was manipulated or invalid
      3. This is OPTIONAL security layer (webhook is required)
      4. Provides instant feedback while webhook processes
      5. Frontend should check verified before showing success
    """

    # --------------------------------------------------------------------------
    # FIELD 1: Verified Flag (Required)
    # --------------------------------------------------------------------------

    verified: bool
    """
    Whether payment is verified as genuine

    Values:
      - True: ✅ Payment is genuine
               • validation_hash matches our calculation
               • Transaction found in database
               • Belongs to current user
               • Safe to show success page

      - False: ❌ Payment is NOT genuine
               • validation_hash mismatch (URL tampered)
               • Transaction not found
               • Belongs to different user
               • Do NOT show success page

    Frontend usage:
      if (response.verified) {
          showSuccessPage();
      } else {
          showErrorPage();
      }
    """

    # --------------------------------------------------------------------------
    # FIELD 2: Message (Required)
    # --------------------------------------------------------------------------

    message: str
    """
    Human-readable message explaining the result

    Examples for verified=true:
      - "Payment verified successfully"
      - "Transaction confirmed"

    Examples for verified=false:
      - "Payment verification failed"
      - "Invalid validation hash"
      - "Transaction not found"
      - "Access denied"

    Always present, helps frontend show appropriate message to user
    """

    # --------------------------------------------------------------------------
    # FIELD 3: Payment Details (Optional, only if verified=true)
    # --------------------------------------------------------------------------

    payment: Optional[Dict[str, Any]] = None
    """
    Payment transaction details (only if verified=true)

    Structure:
      {
          "transaction_id": "PF-2024121514302890123",  # PayFast transaction ID
          "basket_id": "ORDER-20241215143027-XYZ789",  # Our order ID
          "amount": 1000,                              # Amount paid (PKR)
          "status": "completed",                       # Transaction status
          "plan_name": "starter",                      # Subscribed plan
          "created_at": "2024-12-15T14:30:27"         # When initiated
      }

    This is None when verified=false.

    Frontend can use this to:
      1. Show payment confirmation
      2. Display plan details
      3. Track transaction for support
      4. Show receipt/invoice

    Example usage:
      if (data.verified && data.payment) {
          console.log('User paid:', data.payment.amount, 'PKR');
          console.log('For plan:', data.payment.plan_name);
          console.log('Transaction:', data.payment.transaction_id);

          // Show confirmation
          alert(`Successfully subscribed to ${data.payment.plan_name}!`);
      }

    Note: Even though this returns payment details, the subscription is
    created by the WEBHOOK, not this endpoint. This just confirms payment is real.
    """


# ==============================================================================
# SCHEMA 6: WEBHOOK PAYLOAD
# ==============================================================================

class WebhookPayload(BaseModel):
    """
    📲 PayFast Webhook Payload Schema

    This is the data PayFast sends to our CHECKOUT_URL webhook.

    ENDPOINT:
      POST /api/payfast/webhook

    EXAMPLE PAYLOAD:
      {
          "transaction_id": "PF-2024121514302890123",
          "err_code": "000",
          "err_msg": "",
          "basket_id": "ORDER-20241215143027-XYZ789",
          "order_date": "2024-12-15",
          "validation_hash": "e8192a7554dd...",
          "PaymentName": "account",
          "discounted_amount": "0",
          "transaction_amount": "1000",
          "merchant_amount": "1000",
          "transaction_currency": "PKR",
          "Instrument_token": null,
          "Recurring_txn": "False"
      }

    IMPORTANT:
      - This is sent by PayFast, NOT frontend
      - We MUST verify validation_hash before trusting data
      - Store entire payload for audit trail
    """

    transaction_id: Optional[str] = None
    """
    PayFast transaction ID

    Example: "PF-2024121514302890123"

    Can be None for some failed payments
    """

    err_code: str
    """
    Status/error code

    Values:
      - "000" or "00": Success ✅
      - "002": Timeout
      - "104": Incorrect details
      - "55": Invalid OTP
      - etc. (see document.pdf page 22)

    CRITICAL: We check if this is "000" or "00" to mark payment as successful
    """

    err_msg: Optional[str] = None
    """
    Error message (empty string if successful)

    Examples:
      - "" (success)
      - "Entered details are Incorrect"
      - "Insufficient Balance"
    """

    basket_id: str
    """
    Our order ID

    Example: "ORDER-20241215143027-XYZ789"

    CRITICAL: We use this to find the transaction in our database
    """

    order_date: Optional[str] = None
    """
    Order date we sent

    Format: "YYYY-MM-DD"
    Example: "2024-12-15"
    """

    validation_hash: str
    """
    Security hash from PayFast

    Example: "e8192a7554dd699975adf39619c703a49239..."

    CRITICAL: We MUST verify this before processing webhook!

    Verification:
      our_hash = SHA256(basket_id | secret_key | merchant_id | err_code)
      if our_hash == validation_hash:
          process webhook ✅
      else:
          reject webhook ❌
    """

    PaymentName: Optional[str] = None
    """
    Payment method used

    Values:
      - "account": Bank account
      - "card": Credit/Debit card
      - "wallet": Mobile wallet
    """

    discounted_amount: Optional[str] = None
    """Discount amount (if any)"""

    transaction_amount: Optional[str] = None
    """Actual transaction amount"""

    merchant_amount: Optional[str] = None
    """Amount merchant receives"""

    transaction_currency: Optional[str] = None
    """Currency (PKR)"""

    Instrument_token: Optional[str] = None
    """Payment instrument token (for recurring payments)"""

    Recurring_txn: Optional[str] = None
    """Whether this is a recurring transaction"""


# ==============================================================================
# SCHEMA 7: SUBSCRIPTION RESPONSE
# ==============================================================================

class SubscriptionResponse(BaseModel):
    """
    🎁 Subscription Details Response Schema

    WHEN USED:
      GET /api/payfast/subscription
      Returns current user's active subscription

    RESPONSE EXAMPLE:
      {
          "id": "507f1f77bcf86cd799439011",
          "user_id": "507f1f77bcf86cd799439011",
          "plan_name": "starter",
          "billing_cycle": "monthly",
          "amount": 1000,
          "status": "active",
          "start_date": "2024-12-15T14:32:15",
          "end_date": "2025-01-14T14:32:15",
          "features": {
              "max_scans": 5,
              "scan_history_days": 30,
              "api_access": false,
              ...
          },
          "auto_renew": true
      }
    """

    id: str
    """Subscription ID"""

    user_id: str
    """User who owns this subscription"""

    plan_name: str
    """Plan name (starter/professional/enterprise)"""

    billing_cycle: str
    """Billing cycle (monthly/annual)"""

    amount: float
    """Amount paid"""

    status: str
    """Status (active/cancelled/expired)"""

    start_date: datetime
    """When subscription started"""

    end_date: datetime
    """When subscription expires"""

    features: Dict[str, Any]
    """Plan features dictionary"""

    auto_renew: bool
    """Whether auto-renewal is enabled"""


# ==============================================================================
# SCHEMA 8: REFUND REQUEST
# ==============================================================================

class RefundRequest(BaseModel):
    """
    💰 Refund Request Schema

    WHEN USED:
      POST /api/payfast/refund
      User or admin requests refund

    REQUEST EXAMPLE:
      {
          "transaction_id": "PF-2024121514302890123",
          "reason": "Service not as expected",
          "amount": 1000
      }

    VALIDATION:
      - reason must be 10-500 characters
      - amount is optional (full refund if not specified)
    """

    transaction_id: str
    """
    PayFast transaction ID to refund

    Example: "PF-2024121514302890123"

    Must be a completed transaction
    """

    reason: str = Field(..., min_length=10, max_length=500)
    """
    Reason for refund

    Args:
        ...: Required
        min_length=10: At least 10 characters
        max_length=500: At most 500 characters

    Valid Examples:
        ✅ "Service did not meet expectations"
        ✅ "Found better alternative"
        ✅ "Technical issues not resolved"

    Invalid Examples:
        ❌ "Not good" (too short, < 10 chars)
        ❌ "" (empty)
        ❌ Very long essay > 500 chars

    Why 10-500 Range?
      - 10 chars: Ensures user provides real reason
      - 500 chars: Prevents abuse, keeps database clean
    """

    amount: Optional[float] = None
    """
    Refund amount (optional)

    If None:
      - Full refund (entire transaction amount)

    If specified:
      - Partial refund
      - Must be <= transaction amount

    Examples:
      amount=None → Full refund
      amount=500 → Refund 500 PKR (partial)

    Validation:
      Backend checks:
      - amount <= transaction.amount
      - amount > 0
    """


# ==============================================================================
# END OF SCHEMAS
# ==============================================================================

"""
📝 SUMMARY

We defined 8 schemas:

1. CustomerInfo
   - Customer name and mobile
   - Used in PaymentInitiateRequest

2. PaymentInitiateRequest
   - What frontend sends to start payment
   - Contains plan, amount, customer info

3. PaymentInitiateResponse
   - What backend returns after initiate
   - Contains PayFast form data or error

4. PaymentVerifyRequest
   - Verify payment after redirect
   - Optional security step

5. PaymentVerifyResponse
   - Result of verification
   - Contains payment details if verified

6. WebhookPayload
   - Data PayFast sends to webhook
   - Contains transaction result

7. SubscriptionResponse
   - User's subscription details
   - Returned by GET /subscription

8. RefundRequest
   - Request refund for transaction
   - Requires reason and optional amount

HOW FASTAPI USES THESE:
  @router.post("/initiate", response_model=PaymentInitiateResponse)
  async def initiate_payment(
      payment_request: PaymentInitiateRequest,  ← Validates request
      ...
  ) -> PaymentInitiateResponse:  ← Validates response
      ...

BENEFITS:
  ✅ Automatic validation
  ✅ Auto-generated API docs
  ✅ Type hints for IDEs
  ✅ Less bugs, more safety

NEXT FILE: 03_utils.py (Helper Functions)
"""
