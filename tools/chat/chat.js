// eslint-disable-next-line import/no-unresolved
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/+esm';

const submitButton = document.querySelector('#send-button');
const chatContainer = document.querySelector('.chat-container');
const input = document.querySelector('#message-input');
const form = document.querySelector('#chat-form');

const endpoint = 'ws://localhost:8787/chat';

function addChatMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', `message-${message.role}`);
  messageElement.innerHTML = `
    <div class="message-content">
      ${message.content}
    </div>
  `;
  chatContainer.append(messageElement);
}

/**
 * Initialize the chat interface.
 */
async function init() {
  let lastMessageTime = Date.now();
  const websocket = new WebSocket(endpoint);
  websocket.addEventListener('message', (event) => {
    const { type, content } = JSON.parse(event.data);
    switch (type) {
      case 'status': {
        if (content.toLowerCase() === 'done') {
          submitButton.disabled = false;
          input.disabled = false;
        } else {
          addChatMessage({
            role: 'assistant-status',
            content: `Status: ${content}`,
          });
        }
        break;
      }
      case 'error': {
        addChatMessage({
          role: 'assistant',
          content: `Error: ${content}`,
        });
        submitButton.disabled = false;
        input.disabled = false;
        break;
      }
      case 'response': {
        const htmlContent = marked.parse(content);
        addChatMessage({
          role: 'assistant',
          content: htmlContent,
        });
        break;
      }
      default:
        break;
    }
  });

  // post welcome message
  addChatMessage({
    role: 'assistant',
    content: 'Hello! How can I help you today?',
  });

  // handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = input.value;
    if (message) {
      lastMessageTime = Date.now();
      addChatMessage({
        role: 'user',
        content: message,
      });

      // disable submit button
      submitButton.disabled = true;
      input.disabled = true;
      input.value = '';

      websocket.send(message);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !submitButton.disabled) {
      e.preventDefault();
      const message = input.value;
      if (message) {
        lastMessageTime = Date.now();
        addChatMessage({
          role: 'user',
          content: message,
        });

        // disable submit button
        submitButton.disabled = true;
        input.disabled = true;
        input.value = '';

        websocket.send(message);
      }
    }
  });

  // close websocket after inactivity
  setInterval(() => {
    const fiveMinutes = 1000 * 60 * 5;
    if (websocket.readyState === WebSocket.OPEN && Date.now() - lastMessageTime > fiveMinutes) {
      addChatMessage({
        role: 'assistant',
        content: 'Chat ended due to inactivity. Please refresh the page.',
      });
      websocket.close();
    }
  }, 10000);

  // focus the input
  input.focus();
}

// Initialize the chat app
init();
