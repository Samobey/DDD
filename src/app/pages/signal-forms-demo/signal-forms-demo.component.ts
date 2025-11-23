import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, Field } from '@angular/forms/signals';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  subscribe: boolean;
}

@Component({
  selector: 'app-signal-forms-demo',
  standalone: true,
  imports: [CommonModule, Field],
  templateUrl: './signal-forms-demo.component.html',
  styleUrl: './signal-forms-demo.component.scss'
})
export class SignalFormsDemoComponent {
  // Signal Forms model - the foundation (writable signal)
  contactModel = signal<ContactFormData>({
    name: '',
    email: '',
    message: '',
    subscribe: false
  });

  // Create the form from the model - form() creates a FieldTree from the model signal
  contactForm = form(this.contactModel);

  // Computed properties for reactive state
  formValid = computed(() => {
    const model = this.contactModel();
    return (
      model.name.length >= 2 &&
      model.email.includes('@') &&
      model.message.length >= 10
    );
  });

  submitted = signal(false);
  submitSuccess = signal(false);

  onSubmit() {
    this.submitted.set(true);

    if (this.formValid()) {
      const formData = this.contactModel();
      console.log('Form submitted with data:', formData);

      // Simulate API call
      setTimeout(() => {
        this.submitSuccess.set(true);

        // Reset after 3 seconds
        setTimeout(() => {
          this.reset();
        }, 3000);
      }, 500);
    }
  }

  reset() {
    // Reset model to initial values
    this.contactModel.set({
      name: '',
      email: '',
      message: '',
      subscribe: false
    });
    this.submitted.set(false);
    this.submitSuccess.set(false);
  }
}
