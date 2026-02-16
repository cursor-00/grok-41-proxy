#!/usr/bin/env node
import Anthropic from '@anthropic-ai/sdk';
import readline from 'readline';

const anthropic = new Anthropic({
  apiKey: 'local-proxy',
  baseURL: 'http://localhost:3333'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chat() {
  console.log('\n🤖 Puter AI Proxy CLI (type "quit" to exit)\n');
  
  const ask = () => {
    rl.question('You: ', async (question) => {
      if (question.toLowerCase() === 'quit' || question.toLowerCase() === 'exit') {
        console.log('\nGoodbye! 👋\n');
        rl.close();
        return;
      }
      
      try {
        const msg = await anthropic.messages.create({
          model: 'deepseek-chat',
          max_tokens: 2048,
          messages: [{ role: 'user', content: question }]
        });
        
        const response = msg.content[0]?.text || 'No response';
        console.log(`\nAssistant: ${response}\n`);
      } catch (error) {
        console.error(`\nError: ${error.message}\n`);
      }
      
      ask();
    });
  };
  
  ask();
}

chat();
