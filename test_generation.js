const fetch = require('node-fetch');

async function test() {
  console.log('Starting test generation...');
  
  const payload = {
    type: 'lesson',
    topic_id: '00000000-0000-0000-0000-000000000000', // This will trigger the fallback logic
    title: 'The Water Cycle Test',
    subject: 'Science',
    age_group: '8-11 (KS2)',
    key_stage: 'KS2',
    estimated_minutes: 30,
    custom_objectives: 'Understand the stages of the water cycle\nIdentify evaporation and condensation',
    custom_misconceptions: 'Clouds are made of steam',
    custom_real_world: 'Puddles disappearing after rain'
  };

  try {
    const response = await fetch('https://luminary-omega.vercel.app/api/admin/queue-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Test generation successful!', data);
    } else {
      console.error('Test generation failed:', data);
    }
  } catch (error) {
    console.error('Error during test generation:', error);
  }
}

test();
