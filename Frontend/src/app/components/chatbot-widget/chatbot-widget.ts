import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Message {
  sender: 'Bot' | 'You';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="chatbot-container">
      <!-- Toggle Button -->
      <button class="chatbot-toggle" (click)="toggleChat()" [class.active]="isOpen">
        <span *ngIf="!isOpen">💬</span>
        <span *ngIf="isOpen">✕</span>
      </button>

      <!-- Chat Widget -->
      <div class="chatbot-widget" [class.open]="isOpen">
        <div class="chatbot-header">
          <div class="header-content">
            <span class="bot-avatar">🤖</span>
            <div class="header-text">
              <h4>Event Assistant</h4>
              <span class="status">Online</span>
            </div>
          </div>
          <button class="minimize-btn" (click)="toggleChat()">−</button>
        </div>

        <div class="chatbot-messages" #messagesContainer>
          <div *ngFor="let msg of messages" 
               [ngClass]="{'bot-msg': msg.sender === 'Bot', 'user-msg': msg.sender === 'You'}"
               class="message-bubble">
            <div class="message-content">
              <span class="msg-text">{{msg.text}}</span>
              <span class="msg-time">{{formatTime(msg.timestamp)}}</span>
            </div>
          </div>
          <div *ngIf="isTyping" class="typing-indicator">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <div class="quick-actions" *ngIf="showQuickActions">
          <button *ngFor="let action of quickActions" 
                  (click)="handleQuickAction(action)"
                  class="quick-action-btn">
            {{action.text}}
          </button>
        </div>

        <div class="chatbot-input">
          <input [(ngModel)]="userInput" 
                 (keyup.enter)="sendMessage()" 
                 (input)="onInputChange()"
                 placeholder="Type your message..."
                 class="message-input" />
          <button (click)="sendMessage()" 
                  [disabled]="!userInput.trim()" 
                  class="send-btn">
            <span>📤</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Container and Toggle */
    .chatbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .chatbot-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chatbot-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
    }

    .chatbot-toggle.active {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    }

    /* Widget */
    .chatbot-widget {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      height: 500px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      opacity: 0;
      transform: translateY(20px) scale(0.9);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      overflow: hidden;
    }

    .chatbot-widget.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* Header */
    .chatbot-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bot-avatar {
      font-size: 24px;
      background: rgba(255, 255, 255, 0.2);
      padding: 8px;
      border-radius: 50%;
    }

    .header-text h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .status {
      font-size: 12px;
      opacity: 0.8;
    }

    .minimize-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .minimize-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Messages */
    .chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #f8f9fa;
    }

    .message-bubble {
      display: flex;
      animation: slideIn 0.3s ease;
    }

    .bot-msg {
      justify-content: flex-start;
    }

    .user-msg {
      justify-content: flex-end;
    }

    .message-content {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 20px;
      position: relative;
    }

    .bot-msg .message-content {
      background: white;
      border: 1px solid #e9ecef;
      border-bottom-left-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .user-msg .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-right-radius: 8px;
    }

    .msg-text {
      display: block;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .msg-time {
      font-size: 11px;
      opacity: 0.6;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      justify-content: flex-start;
    }

    .typing-dots {
      background: white;
      padding: 12px 16px;
      border-radius: 20px;
      border-bottom-left-radius: 8px;
      border: 1px solid #e9ecef;
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .typing-dots span {
      width: 6px;
      height: 6px;
      background: #667eea;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    /* Quick Actions */
    .quick-actions {
      padding: 16px 20px;
      background: white;
      border-top: 1px solid #e9ecef;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .quick-action-btn {
      padding: 8px 12px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quick-action-btn:hover {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    /* Input */
    .chatbot-input {
      padding: 20px;
      background: white;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .message-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #dee2e6;
      border-radius: 25px;
      outline: none;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .message-input:focus {
      border-color: #667eea;
    }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.1);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Animations */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-10px);
      }
    }

    /* Scrollbar */
    .chatbot-messages::-webkit-scrollbar {
      width: 4px;
    }

    .chatbot-messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .chatbot-messages::-webkit-scrollbar-thumb {
      background: #dee2e6;
      border-radius: 4px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .chatbot-widget {
        width: 320px;
        height: 450px;
      }
    }
  `]
})
export class ChatbotWidgetComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @Output() fillForm = new EventEmitter<any>();

  messages: Message[] = [
    { 
      sender: 'Bot', 
      text: 'Hi! I\'m your Event Assistant 🎉 I can help you create events quickly. Try saying "help" or "guide me" to get started!',
      timestamp: new Date()
    }
  ];
  
  userInput = '';
  isOpen = false;
  isTyping = false;
  showQuickActions = true;
  
  quickActions = [
    { text: '🎵 Music Event', action: 'music' },
    { text: '🎭 Theatre Show', action: 'theatre' },
    { text: '🏃 Sports Event', action: 'sports' },
    { text: '📚 Workshop', action: 'workshop' },
    { text: '❓ Help', action: 'help' }
  ];

  private conversationContext = {
    currentStep: '',
    eventData: {},
    isGuiding: false
  };

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  onInputChange() {
    // You can add typing indicators or other input handling here
  }

  handleQuickAction(action: any) {
    this.userInput = action.text;
    this.sendMessage();
  }

  sendMessage() {
    const input = this.userInput.trim();
    if (!input) return;

    // Add user message
    this.messages.push({ 
      sender: 'You', 
      text: input,
      timestamp: new Date()
    });

    this.userInput = '';
    this.showTypingIndicator();

    // Process the message
    setTimeout(() => {
      this.processMessage(input);
      this.isTyping = false;
    }, 1000);
  }

  private showTypingIndicator() {
    this.isTyping = true;
    this.showQuickActions = false;
  }

  private processMessage(input: string) {
    const lowerInput = input.toLowerCase();
    let response = '';
    let formData = {};

    // Help commands
    if (lowerInput.includes('help') || lowerInput.includes('guide')) {
      response = `I can help you with:
      
🎯 **Quick Creation**: Say things like "Create a music event" or "Make a workshop"
📝 **Form Filling**: I can auto-fill the event form based on your description
⚡ **Smart Suggestions**: Get recommendations for venues, pricing, and timing
🔍 **Event Ideas**: Need inspiration? Just ask!

Try: "Create a music concert" or "Help me plan a workshop"`;
      this.conversationContext.isGuiding = true;
    }
    
    // Event type detection and form filling
    else if (lowerInput.includes('music') || lowerInput.includes('concert')) {
      formData = {
        category: 'Music',
        title: 'Music Concert',
        description: 'An amazing musical performance',
        duration: '3 hours'
      };
      response = '🎵 Great! I\'ve set up a Music event template. The form has been filled with some defaults. What\'s the event title?';
    }
    
    else if (lowerInput.includes('theatre') || lowerInput.includes('drama')) {
      formData = {
        category: 'Theatre',
        title: 'Theatre Performance',
        description: 'A captivating theatrical experience',
        duration: '2 hours'
      };
      response = '🎭 Perfect! I\'ve prepared a Theatre event template. You can modify the details in the form above.';
    }
    
    else if (lowerInput.includes('sports') || lowerInput.includes('game')) {
      formData = {
        category: 'Sports',
        title: 'Sports Event',
        description: 'An exciting sports competition',
        duration: '4 hours'
      };
      response = '🏃 Awesome! Sports event template is ready. Don\'t forget to set the date and venue!';
    }
    
    else if (lowerInput.includes('workshop') || lowerInput.includes('seminar')) {
      formData = {
        category: 'Education',
        title: 'Educational Workshop',
        description: 'An informative and interactive workshop',
        duration: '2 hours',
        price: 500
      };
      response = '📚 Excellent! Workshop template created. Consider adding the speaker/instructor name in the Artist field.';
    }
    
    else if (lowerInput.includes('comedy') || lowerInput.includes('standup')) {
      formData = {
        category: 'Comedy',
        title: 'Comedy Show',
        description: 'A hilarious comedy performance',
        duration: '90 minutes',
        price: 300
      };
      response = '😂 Fantastic! Comedy show template is set. Make sure to add the comedian\'s name!';
    }
    
    // Pricing suggestions
    else if (lowerInput.includes('price') || lowerInput.includes('cost')) {
      response = `💰 **Pricing Suggestions**:
      
🎵 Music Events: ₹300-₹1500
🎭 Theatre: ₹200-₹800  
🏃 Sports: ₹100-₹500
📚 Workshops: ₹500-₹2000
😂 Comedy: ₹200-₹600

Consider your audience and venue when setting prices!`;
    }
    
    // Venue suggestions
    else if (lowerInput.includes('venue') || lowerInput.includes('location')) {
      response = `📍 **Venue Tips**:
      
🏛️ **Auditoriums**: Best for music, theatre, presentations
🏟️ **Stadiums**: Perfect for large sports events
🏢 **Conference Halls**: Ideal for workshops, seminars
🌳 **Outdoor Spaces**: Great for festivals, sports
🍽️ **Restaurants**: Good for intimate events

Choose based on your expected audience size!`;
    }
    
    // Timing suggestions
    else if (lowerInput.includes('time') || lowerInput.includes('when')) {
      response = `⏰ **Best Event Times**:
      
🌅 **Morning** (9-12 PM): Workshops, seminars
🌞 **Afternoon** (2-5 PM): Sports, outdoor events
🌆 **Evening** (6-9 PM): Music, theatre, comedy
🌙 **Night** (8-11 PM): Concerts, parties

Weekend evenings tend to have better attendance!`;
    }
    
    // Default responses
    else if (lowerInput.includes('thank')) {
      response = '🙏 You\'re welcome! Happy to help you create amazing events. Need anything else?';
    }
    
    else {
      response = `I'd love to help! Try saying:
      
✨ "Create a [type] event" - for quick templates
💡 "Help with pricing" - for cost suggestions  
📍 "Venue recommendations" - for location tips
⏰ "Best timing" - for scheduling advice

What kind of event are you planning?`;
    }

    // Add bot response
    this.messages.push({ 
      sender: 'Bot', 
      text: response,
      timestamp: new Date()
    });

    // Emit form data if available
    if (Object.keys(formData).length > 0) {
      this.fillForm.emit(formData);
    }

    // Show quick actions again
    setTimeout(() => {
      this.showQuickActions = true;
    }, 500);
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}