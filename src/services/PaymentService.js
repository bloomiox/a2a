// Payment Service - Simulated payment processing
// In a real application, this would integrate with Stripe, PayPal, or other payment providers

class PaymentService {
  // Simulate payment processing
  static async processPayment(paymentData) {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Basic validation
        if (!paymentData.card_number || !paymentData.expiry_date || !paymentData.cvv) {
          reject(new Error('Missing payment information'));
          return;
        }

        // Simulate payment success/failure (90% success rate)
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
          resolve({
            success: true,
            transaction_id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: paymentData.amount,
            currency: paymentData.currency || 'USD',
            status: 'completed',
            payment_method: 'card',
            card_last_four: paymentData.card_number.slice(-4),
            processed_at: new Date().toISOString()
          });
        } else {
          reject(new Error('Payment declined. Please check your card details and try again.'));
        }
      }, 2000); // 2 second delay to simulate processing
    });
  }

  // Validate card number (basic Luhn algorithm)
  static validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (!/^\d+$/.test(cleanNumber)) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Validate expiry date
  static validateExpiryDate(expiryDate) {
    const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;

    const month = parseInt(match[1]);
    const year = parseInt(match[2]) + 2000;

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const expiry = new Date(year, month - 1);

    return expiry > now;
  }

  // Validate CVV
  static validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
  }

  // Format card number for display
  static formatCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return cleanNumber.replace(/(.{4})/g, '$1 ').trim();
  }

  // Get card type from number
  static getCardType(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6/.test(cleanNumber)) return 'discover';
    
    return 'unknown';
  }

  // Calculate processing fee (if applicable)
  static calculateProcessingFee(amount, cardType = 'visa') {
    const feeRates = {
      visa: 0.029,
      mastercard: 0.029,
      amex: 0.035,
      discover: 0.029,
      unknown: 0.029
    };

    const rate = feeRates[cardType] || feeRates.unknown;
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
  }

  // Simulate refund processing
  static async processRefund(transactionId, amount, reason = 'Customer request') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate refund success (95% success rate)
        const isSuccess = Math.random() > 0.05;
        
        if (isSuccess) {
          resolve({
            success: true,
            refund_id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            original_transaction_id: transactionId,
            amount: amount,
            status: 'completed',
            reason: reason,
            processed_at: new Date().toISOString()
          });
        } else {
          reject(new Error('Refund processing failed. Please contact support.'));
        }
      }, 1500);
    });
  }
}

export default PaymentService;