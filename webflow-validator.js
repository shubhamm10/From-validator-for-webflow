class WebflowValidator {
  constructor() {
    this.init();
    
    // Common business domains to reject
    this.invalidDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'
    ];
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupForms());
    } else {
      this.setupForms();
    }

    // Watch for dynamic form additions
    this.observeNewForms();
  }

  setupForms() {
    // Find all Webflow forms
    const forms = document.querySelectorAll('.w-form form');
    forms.forEach(form => this.initializeForm(form));
  }

  initializeForm(form) {
    // Prevent double initialization
    if (form.dataset.validatorInit) return;
    form.dataset.validatorInit = 'true';

    // Find fields with validation attributes
    const fields = form.querySelectorAll('[data-validate]');
    
    fields.forEach(field => {
      // Create error container
      const errorDiv = document.createElement('div');
      errorDiv.className = 'validator-error';
      errorDiv.style.display = 'none';
      field.parentNode.insertBefore(errorDiv, field.nextSibling);

      // Add real-time validation
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => this.validateField(field));
    });

    // Add form submission validation
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  validateField(field) {
    const validations = field.dataset.validate.split(',');
    const errorDiv = field.parentNode.querySelector('.validator-error');
    
    // Reset validation state
    field.classList.remove('validator-error-field', 'validator-success-field');
    errorDiv.style.display = 'none';

    for (const validation of validations) {
      const [rule, param] = validation.trim().split(':');
      const error = this.runValidation(rule, field.value, param);
      
      if (error) {
        field.classList.add('validator-error-field');
        errorDiv.textContent = error;
        errorDiv.style.display = 'block';
        return false;
      }
    }

    field.classList.add('validator-success-field');
    return true;
  }

  runValidation(rule, value, param) {
    switch (rule) {
      case 'required':
        return !value.trim() ? 'This field is required' : null;
        
      case 'email':
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return 'Please enter a valid email address';
        }
        // Check business domain
        const domain = value.split('@')[1];
        if (this.invalidDomains.includes(domain?.toLowerCase())) {
          return 'Please use your business email address';
        }
        return null;
        
      case 'phone':
        // Allow +, spaces, dashes, parentheses, and numbers
        return !value.match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/) 
          ? 'Please enter a valid phone number' 
          : null;
          
      case 'minLength':
        return value.length < parseInt(param) 
          ? `Must be at least ${param} characters` 
          : null;
          
      case 'maxLength':
        return value.length > parseInt(param) 
          ? `Must be no more than ${param} characters` 
          : null;
          
      default:
        return null;
    }
  }

  handleSubmit(e) {
    const form = e.target;
    const fields = form.querySelectorAll('[data-validate]');
    let isValid = true;

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      e.preventDefault();
      // Scroll to first error
      const firstError = form.querySelector('.validator-error-field');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  observeNewForms() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList?.contains('w-form')) {
            const form = node.querySelector('form');
            if (form) this.initializeForm(form);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize when script loads
new WebflowValidator();
