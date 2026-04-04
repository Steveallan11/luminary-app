import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { createHash } from 'crypto';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
  console.error('Missing or placeholder Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SUBJECTS = [
  { name: 'Science', slug: 'science', icon_emoji: '🔬', colour_hex: '#10b981' },
  { name: 'Maths', slug: 'maths', icon_emoji: '➗', colour_hex: '#3b82f6' },
  { name: 'English', slug: 'english', icon_emoji: '📚', colour_hex: '#f59e0b' },
];

// Topics for MVP (2 per subject)
const TOPICS_BY_SUBJECT: Record<string, Array<{ title: string; slug: string; description: string }>> = {
  maths: [
    { title: 'Number Sense', slug: 'number-sense', description: 'Understanding numbers, counting and place value' },
    { title: 'Fractions', slug: 'fractions', description: 'Sharing equally with fractions' },
  ],
  english: [
    { title: 'Phonics', slug: 'phonics', description: 'Sound recognition and phonetic awareness' },
    { title: 'Reading', slug: 'reading', description: 'Building reading and comprehension' },
  ],
  science: [
    { title: 'Life Cycles', slug: 'life-cycles', description: 'Growth and change in living things' },
    { title: 'States of Matter', slug: 'states-of-matter', description: 'Exploring solids, liquids and gases' },
  ],
};

const LESSON_SPEC = {
  fractions: {
    age_group: '8-11' as const,
    key_stage: 'KS2',
    spark_json: {
      hook_type: 'real_world',
      hook_content: 'Imagine dividing a chocolate bar with three friends so everyone gets a fair slice.',
      opening_question: 'What fraction of the bar does each person get if you divide it equally?',
      expected_responses: ['1/4', 'equal shares', 'quarter'],
      prior_knowledge_integration: 'If the child mentions sharing, build on that idea immediately.',
    },
    explore_json: {
      concepts: [
        {
          id: 'fractions-exp-1',
          title: 'Fair shares',
          explanation: 'Fractions show how many equal parts we take from a whole. Make sure the parts are equal first.',
          analogy: 'Think of slicing a pizza into matching wedges.',
          real_example: 'Sharing stickers with your friends.',
          check_question: 'Why must the parts be equal before you call it a fraction?',
          common_mistake: 'Taking unequal parts but pretending they are equal.',
        },
      ],
      sequence_notes: 'Start with objects, then represent as drawings, finally write the fraction.',
    },
    anchor_json: {
      method: 'teach_back',
      prompt: 'Can you show me how to split 8 counters equally between 4 people?',
      mastery_indicators: ['groups are equal', 'labels each group', 'uses fraction notation'],
      fallback_approach: 'Draw the counters in rows of four and label the fractions.',
    },
    practise_json: {
      questions: [
        {
          id: 'fractions-practice-1',
          question: '8 cookies shared between 4 friends. How many cookies does each friend get?',
          difficulty: 1,
          correct_answer: '2',
          explanation: '8 divided by 4 equals 2.',
          hint: 'Group the cookies into four equal heaps.',
        },
        {
          id: 'fractions-practice-2',
          question: 'What fraction of a cake is one slice if the cake is cut into 6 equal slices?',
          difficulty: 2,
          correct_answer: '1/6',
          explanation: 'One slice out of six equal slices.',
          hint: 'Count how many slices make the whole cake.',
        },
      ],
    },
    create_json: {
      task_type: 'design',
      brief: 'Design a party treat plan using drawings and fractions to share it fairly.',
      scaffolding: 'Draw the treat, split it into equal sections, then label each section.',
      real_world_connection: 'Chefs use fractions to share ingredients evenly.',
      interest_placeholder: 'Ask whether they would rather split cake, pizza, or sweets.',
    },
    check_json: {
      questions: [
        {
          type: 'explain',
          question: 'Why do we need equal parts before we write a fraction?',
          what_correct_looks_like: 'Talks about fairness and equal sizing.',
        },
      ],
    },
    celebrate_json: {
      fun_fact: 'Ancient Egyptians used special symbols to write fractions.',
      next_topic_teaser: 'Next we will explore halves, quarters, and thirds in more detail.',
      praise_templates: ['That was such fair sharing!', 'Top-notch fraction thinking!'],
    },
    game_type: 'match_it' as const,
    game_content: {
      pairs: [
        { id: 'p1', left: '1/2', right: 'One half', explanation: 'Half is one of two equal parts' },
        { id: 'p2', left: '1/4', right: 'One quarter', explanation: 'Quarter is one of four equal parts' },
        { id: 'p3', left: '1/3', right: 'One third', explanation: 'Third is one of three equal parts' },
      ],
    },
    quality_score: 90,
  },
  'number-sense': {
    age_group: '8-11' as const,
    key_stage: 'KS2',
    spark_json: {
      hook_type: 'scenario',
      hook_content: 'Lyla counts 27 glitter stars to share across three boxes.',
      opening_question: 'What strategy would help you count them quickly?',
      expected_responses: ['grouping', 'skip counting', 'tens and ones'],
      prior_knowledge_integration: 'Build on any mention of grouping tens/ones.',
    },
    explore_json: {
      concepts: [
        {
          id: 'numbersense-exp-1',
          title: 'Grouping makes counting easier',
          explanation: 'Put objects into tens or fives to count without recounting.',
          analogy: 'It is like bundling pencils—count bundles, then add extras.',
          real_example: 'Using ten-frames helps counting fast.',
          check_question: 'Why is it quicker to count tens instead of 27 single stars?',
          common_mistake: 'Counting the same objects twice because they mix together.',
        },
      ],
      sequence_notes: 'Demonstrate grouping, represent with base-ten diagrams, label totals.',
    },
    anchor_json: {
      method: 'teach_back',
      prompt: 'Explain how you grouped 27 counters to count them accurately.',
      mastery_indicators: ['explicit grouping', 'records total', 'uses counting words'],
      fallback_approach: 'Model grouping blocks and re-count once in tidy stacks.',
    },
    practise_json: {
      questions: [
        {
          id: 'numbersense-prac-1',
          question: 'How many counters when you make 2 tens and 5 ones?',
          difficulty: 1,
          correct_answer: '25',
          explanation: '2 tens = 20, plus 5 ones = 25.',
          hint: 'Count tens first, then add ones.',
        },
        {
          id: 'numbersense-prac-2',
          question: 'You have 34 stickers. If you group them into tens, how many groups of ten and leftovers do you get?',
          difficulty: 3,
          correct_answer: '3 tens and 4 ones',
          explanation: '30 makes three tens, 4 leftovers = 34.',
          hint: 'Divide 34 by 10; remainders are ones.',
        },
      ],
    },
    create_json: {
      task_type: 'design',
      brief: 'Make your own counting chart using bundles and ones.',
      scaffolding: 'Draw tens rows and place extra dots for ones.',
      real_world_connection: 'Cashiers count money in tens/ones to check totals.',
      interest_placeholder: 'Would you count coins, marbles, or stamps?',
    },
    check_json: {
      questions: [
        {
          type: 'explain',
          question: 'Why do groups of ten help you count faster?',
          what_correct_looks_like: 'Mentions bundles/tens and saves time.',
        },
      ],
    },
    celebrate_json: {
      fun_fact: 'The number 10 is the base of our place-value system because we have ten fingers.',
      next_topic_teaser: 'Next we can explore how tens help with addition and subtraction.',
      praise_templates: ['Bundling like a pro!', 'You counted so smartly!'],
    },
    game_type: 'sort_it' as const,
    game_content: {
      categories: [
        { id: 'c1', name: 'Tens', colour: '#3B82F6' },
        { id: 'c2', name: 'Ones', colour: '#10B981' },
      ],
      items: [
        { id: 'i1', text: '20', correct_category: 'c1', explanation: 'Two tens' },
        { id: 'i2', text: '7', correct_category: 'c2', explanation: 'Seven ones' },
        { id: 'i3', text: '30', correct_category: 'c1', explanation: 'Three tens' },
        { id: 'i4', text: '5', correct_category: 'c2', explanation: 'Five ones' },
      ],
    },
    quality_score: 88,
  },
  phonics: {
    age_group: '5-7' as const,
    key_stage: 'KS1',
    spark_json: {
      hook_type: 'story',
      hook_content: 'A sneaky snake wants to hide letters in the grass.',
      opening_question: 'Can you hear the /s/ sound in this sentence?',
      expected_responses: ['/s/', 'sss', 'snake'],
      prior_knowledge_integration: 'Pick up on any letter-sound connections already known.',
    },
    explore_json: {
      concepts: [
        {
          id: 'phonics-exp-1',
          title: 'Sssss sound',
          explanation: 'The letter S makes the /s/ sound like a snake hissing.',
          analogy: 'Pretend to be a snake and hiss the /s/ sound.',
          real_example: 'Words like sun, sit, and best have the /s/ sound.',
          check_question: 'Which word has the /s/ sound: bat or sip?',
          common_mistake: 'Confusing /s/ with /sh/ or /z/.',
        },
      ],
      sequence_notes: 'Introduce letter, practise sound aloud, spot it in words.',
    },
    anchor_json: {
      method: 'teach_back',
      prompt: 'Tell Lumi how to make the /s/ sound with your mouth.',
      mastery_indicators: ['makes hissing sound', 'names letter', 'gives example word'],
      fallback_approach: 'Show mouth shape and model several words.',
    },
    practise_json: {
      questions: [
        {
          id: 'phonics-prac-1',
          question: 'Does the word "sun" start with the /s/ sound?',
          difficulty: 1,
          correct_answer: 'Yes',
          explanation: 'Sun starts with /s/.',
          hint: 'Say the word slowly and listen.',
        },
        {
          id: 'phonics-prac-2',
          question: 'Which word has the /s/ sound: ship or sip?',
          difficulty: 2,
          correct_answer: 'Sip',
          explanation: 'Sip starts with /s/, ship starts with /sh/.',
          hint: 'Listen to the start of each word.',
        },
      ],
    },
    create_json: {
      task_type: 'write_it',
      brief: 'Write three words that begin with the /s/ sound.',
      scaffolding: 'Draw matching pictures if you like.',
      real_world_connection: 'Read labels at home, spot the /s/ words.',
      interest_placeholder: 'Do you want to name foods, animals, or toys?',
    },
    check_json: {
      questions: [
        {
          type: 'explain',
          question: 'What do you do with your mouth to make the /s/ sound?',
          what_correct_looks_like: 'Mentions hissing or teeth close together.',
        },
      ],
    },
    celebrate_json: {
      fun_fact: 'The letter S is the 19th letter of the alphabet.',
      next_topic_teaser: 'Next we can blend the /s/ sound with vowels to make words.',
      praise_templates: ['Such a sssssuper sound!', 'You listened like a phonics detective!'],
    },
    game_type: 'fill_it' as const,
    game_content: {
      questions: [
        {
          id: 'f1',
          template: '___ is the sound of a snake.',
          blanks: [{ position: 0, answer: 'S', hint: 'It looks like a slithering snake.' }],
        },
        {
          id: 'f2',
          template: 'The word __ starts with /s/.',
          blanks: [{ position: 0, answer: 'sun', hint: 'The sun shines bright.' }],
        },
      ],
    },
    quality_score: 84,
  },
  reading: {
    age_group: '8-11' as const,
    key_stage: 'KS2',
    spark_json: {
      hook_type: 'real_world',
      hook_content: 'Lumi discovers a secret note hidden under the pillow.',
      opening_question: 'What clues help you understand what the author means?',
      expected_responses: ['words', 'pictures', 'tone'],
      prior_knowledge_integration: 'Tie into favourite stories or reading habits.',
    },
    explore_json: {
      concepts: [
        {
          id: 'reading-exp-1',
          title: 'Clue detectives',
          explanation: 'Look for context clues and illustrations to understand new words.',
          analogy: 'It is like using a torch to shine light on tricky paragraphs.',
          real_example: 'When a story describes a sad face, you know the character feels down.',
          check_question: 'What clue tells you someone is surprised?',
          common_mistake: 'Ignoring supporting sentences and guessing randomly.',
        },
      ],
      sequence_notes: 'Read short passage, pause to predict meaning, check answers.',
    },
    anchor_json: {
      method: 'teach_back',
      prompt: 'Tell Lumi which clues you used to understand the paragraph.',
      mastery_indicators: ['identifies multiple clues', 'mentions evidence', 'uses full sentence'],
      fallback_approach: 'Highlight key sentence and decode together.',
    },
    practise_json: {
      questions: [
        {
          id: 'reading-prac-1',
          question: 'The story says her hands shook. What clue tells you she is nervous?',
          difficulty: 2,
          correct_answer: 'Hands shaking means she is nervous.',
          explanation: 'The description shows her body reaction.',
          hint: 'How do you feel when your hands shake?',
        },
      ],
    },
    create_json: {
      task_type: 'write_it',
      brief: 'Write a short summary of a scene using context clues.',
      scaffolding: 'List the clues, then write how they make you feel.',
      real_world_connection: 'Review notes when reading instructions or recipes.',
      interest_placeholder: 'Pick a scene from a story you love.',
    },
    check_json: {
      questions: [
        {
          type: 'explain',
          question: 'Which sentence helped you understand the tricky word?',
          what_correct_looks_like: 'References specific sentence and explains meaning.',
        },
      ],
    },
    celebrate_json: {
      fun_fact: 'Readers in the 1800s also used clues to make sense of stories.',
      next_topic_teaser: 'Next, we can compare two scenes and talk about the mood.',
      praise_templates: ['Sharp reader thinking!', 'You spotted that clue fast!'],
    },
    game_type: 'true_false' as const,
    game_content: {
      statements: [
        { id: 'tg1', statement: 'Hands shaking means someone is calm.', is_true: false, explanation: 'It usually means they are nervous.' },
        { id: 'tg2', statement: 'Describing a stormy sky helps show mood.', is_true: true, explanation: 'Weather words give clues about feelings.' },
      ],
    },
    quality_score: 85,
  },
  'life-cycles': {
    age_group: '8-11' as const,
    key_stage: 'KS2',
    spark_json: {
      hook_type: 'real_world',
      hook_content: 'A seed opens up and a tiny sprout appears.',
      opening_question: 'What do you think happens next in the life cycle?',
      expected_responses: ['grows leaves', 'becomes plant', 'flowers'],
      prior_knowledge_integration: 'Link to pets/plants the child already cares for.',
    },
    explore_json: {
      concepts: [
        {
          id: 'lifecycle-exp-1',
          title: 'Stages of change',
          explanation: 'Living things go through stages: beginning, growing, reproducing, aging.',
          analogy: 'Like a butterfly moving from egg to caterpillar to butterfly.',
          real_example: 'Frogs start as eggs, become tadpoles, then frogs.',
          check_question: 'What stage comes after growing?',
          common_mistake: 'Skipping a stage and jumping ahead.',
        },
      ],
      sequence_notes: 'Order cards, describe changes, compare to other animals.',
    },
    anchor_json: {
      method: 'teach_back',
      prompt: 'Explain a life cycle to Lumi using pictures or words.',
      mastery_indicators: ['uses sequence', 'names stages', 'mentions change'],
      fallback_approach: 'Use story cards to guide description.',
    },
    practise_json: {
      questions: [
        {
          id: 'lifecycle-prac-1',
          question: 'What stage follows the egg for a butterfly?',
          difficulty: 2,
          correct_answer: 'Caterpillar (larva)',
          explanation: 'Butterfly eggs hatch into caterpillars.',
          hint: 'Think of something that eats leaves before it flies.',
        },
      ],
    },
    create_json: {
      task_type: 'connect_it',
      brief: 'Match pictures to the correct life cycle stage for a chosen animal.',
      scaffolding: 'Label each picture with the stage name.',
      real_world_connection: 'Farm animals also have clear life cycles.',
      interest_placeholder: 'Choose a pet, bird or insect you like.',
    },
    check_json: {
      questions: [
        {
          type: 'explain',
          question: 'Describe how the caterpillar becomes a butterfly.',
          what_correct_looks_like: 'Mentions chrysalis/pupa and transformation.',
        },
      ],
    },
    celebrate_json: {
      fun_fact: 'Butterflies taste with their feet!',
      next_topic_teaser: 'Next we will look at how animals care for their young.',
      praise_templates: ['What a thoughtful life cycle description!', 'Lumi loves your science brain!'],
    },
    game_type: 'build_it' as const,
    game_content: {
      title: 'Order the life cycle',
      type: 'sequence',
      items: [
        { id: 'b1', content: 'Egg laid', correct_position: 1 },
        { id: 'b2', content: 'Larva hatches and eats', correct_position: 2 },
        { id: 'b3', content: 'Pupa forms', correct_position: 3 },
        { id: 'b4', content: 'Butterfly emerges', correct_position: 4 },
      ],
    },
    quality_score: 87,
  },
  'states-of-matter': {
    age_group: '11-14' as const,
    key_stage: 'KS3',
    spark_json: {
      hook_type: 'real_world',
      hook_content: 'Steam rises from a kettle while the kettle stays in one place.',
      opening_question: 'What is the steam doing differently from the kettle?',
      expected_responses: ['moving', 'gas', 'invisible'],
      prior_knowledge_integration: 'Connect to everyday boiling/water experiences.',
    },
    explore_json: {
      concepts: [
        {
          id: 'matter-exp-1',
          title: 'Solid, liquid, gas',
          explanation: 'Matter keeps shape as solid, flows as liquid, spreads out as gas.',
          analogy: 'Solid is like a brick, liquid like water, gas like air you can’t hold.',
          real_example: 'Ice cubes vs. puddles vs. steam.',
          check_question: 'Why does a gas fill a whole room while a solid keeps its shape?',
          common_mistake: 'Confusing liquid with gas movement.',
        },
      ],
      sequence_notes: 'Show substances, sort cards, discuss particle arrangement.',
    },
    anchor_json: {
      method: 'teach_back',
      prompt: 'Explain the difference between a solid and a gas.',
      mastery_indicators: ['describes particles', 'gives example', 'uses comparison'],
      fallback_approach: 'Use diagrams showing particles closely packed vs spread out.',
    },
    practise_json: {
      questions: [
        {
          id: 'matter-prac-1',
          question: 'Is water a solid, liquid, or gas at room temperature?',
          difficulty: 1,
          correct_answer: 'Liquid',
          explanation: 'Water flows and takes container shape; hence liquid.',
          hint: 'Think about a glass of water.',
        },
      ],
    },
    create_json: {
      task_type: 'connect_it',
      brief: 'Match states of matter to everyday objects or examples.',
      scaffolding: 'Draw or name one solid, liquid, and gas.',
      real_world_connection: 'Engineers use states of matter in designing machines.',
      interest_placeholder: 'Pick a state you find most curious.',
    },
    check_json: {
      questions: [
        {
          type: 'explain',
          question: 'Why does steam rise while ice stays still?',
          what_correct_looks_like: 'Mentions particles moving faster and spreading apart.',
        },
      ],
    },
    celebrate_json: {
      fun_fact: 'The same water you drink can float as gas, fall as rain, and freeze as ice.',
      next_topic_teaser: 'Next we can explore how heat changes the state of matter.',
      praise_templates: ['Matter master!', 'Steam-powered thinking!'],
    },
    game_type: 'quick_fire' as const,
    game_content: {
      questions: [
        { id: 'q1', question: 'Ice is a _____.', options: ['Solid', 'Liquid', 'Gas', 'Plasma'], correct: 'Solid', explanation: 'Ice keeps shape.' },
        { id: 'q2', question: 'Steam is a _____.', options: ['Liquid', 'Gas', 'Solid', 'Dust'], correct: 'Gas', explanation: 'Steam spreads to fill space.' },
      ],
      time_limit: 60,
      question_count: 2,
    },
    quality_score: 89,
  },
};

const ASSET_SPEC = {
  fractions: [
    {
      asset_type: 'concept_card' as const,
      asset_subtype: null,
      title: 'What is a Fraction?',
      content_json: {
        tagline: 'Fair slices for everyone',
        hook_question: 'If you share 1 pizza with 3 friends, how much does each person get?',
        definition: 'Fractions show how we split a whole into equal parts.',
        image_prompt: 'Colourful pizza split into 4 equal slices with one slice highlighted',
      },
    },
    {
      asset_type: 'realworld_card' as const,
      asset_subtype: 'everyday',
      title: 'Kitchen Fractions',
      content_json: {
        type: 'everyday',
        title: 'Kitchen Fractions',
        description: 'Recipes use fractions for cups of flour and spoons of sugar.',
        scenario: 'You need 3/4 cup of sugar but only poured 1/2 cup. How much more do you need?',
        image_prompt: 'Child measuring ingredients with colourful cups.',
      },
    },
    {
      asset_type: 'game_questions' as const,
      asset_subtype: 'match_it' as const,
      title: 'Match the Fractions',
      content_json: {
        pairs: [
          { id: 'g1', left: '1/2', right: 'One half', explanation: 'Half means one of two equal pieces.' },
          { id: 'g2', left: '1/4', right: 'One quarter', explanation: 'Quarter means one of four equal pieces.' },
          { id: 'g3', left: '1/3', right: 'One third', explanation: 'Third means one of three equal pieces.' },
        ],
      },
    },
  ],
  'number-sense': [
    {
      asset_type: 'concept_card' as const,
      asset_subtype: null,
      title: 'Counting by Bundles',
      content_json: {
        tagline: 'Tens and ones',
        hook_question: 'What happens if you count coins in groups of 10?',
        definition: 'Grouping by tens helps us count faster.',
        image_prompt: 'Groups of coins arranged in tens with loose ones beside them',
      },
    },
    {
      asset_type: 'realworld_card' as const,
      asset_subtype: 'everyday',
      title: 'Counting in the Shop',
      content_json: {
        type: 'everyday',
        title: 'Counting in the Shop',
        description: 'Shopkeepers count tens of toys before putting them on the shelf.',
        scenario: 'You buy 26 stickers: store them as two tens and six ones.',
        image_prompt: 'Child counting stickers with helper cards showing tens and ones',
      },
    },
  ],
  phonics: [
    {
      asset_type: 'concept_card' as const,
      asset_subtype: null,
      title: 'Sound of /s/',
      content_json: {
        tagline: 'Hiss like a snake',
        hook_question: 'Can you hear the snake sound in these words?',
        definition: '/s/ is made with teeth close together and a hiss.',
        image_prompt: 'Cartoon snake hissing with letters popping out',
      },
    },
    {
      asset_type: 'game_questions' as const,
      asset_subtype: 'fill_it' as const,
      title: 'Fill the S Sound',
      content_json: {
        questions: [
          { id: 's1', template: 'Sir Sally sells _____ seashells', blanks: [{ position: 0, answer: 'sea', hint: 'Starts with /s/ ' }] },
        ],
      },
    },
  ],
  reading: [
    {
      asset_type: 'concept_card' as const,
      asset_subtype: null,
      title: 'Clue Detective',
      content_json: {
        tagline: 'Looking for clues',
        hook_question: 'What do the words around a tricky word tell us?',
        definition: 'Context clues help us understand new words.',
        image_prompt: 'Detective child reading a book with magnifying glass',
      },
    },
    {
      asset_type: 'game_questions' as const,
      asset_subtype: 'true_false' as const,
      title: 'Clue Match',
      content_json: {
        statements: [
          { id: 'c1', statement: 'The picture might help you understand the word.', is_true: true, explanation: 'Pictures show the meaning.' },
          { id: 'c2', statement: 'Context clues are not useful.', is_true: false, explanation: 'They help a lot.' },
        ],
      },
    },
  ],
  'life-cycles': [
    {
      asset_type: 'concept_card' as const,
      asset_subtype: null,
      title: 'Life Cycle Loop',
      content_json: {
        tagline: 'Egg to adult',
        hook_question: 'What comes after the caterpillar stage?',
        definition: 'Life cycles have ordered stages: birth, growth, reproduction, aging.',
        image_prompt: 'A butterfly life cycle showing egg, caterpillar, chrysalis, butterfly',
      },
    },
    {
      asset_type: 'game_questions' as const,
      asset_subtype: 'build_it' as const,
      title: 'Sequence the Life Cycle',
      content_json: {
        title: 'Life cycle order',
        type: 'sequence',
        items: [
          { id: 's1', content: 'Egg', correct_position: 1 },
          { id: 's2', content: 'Larva / Caterpillar', correct_position: 2 },
          { id: 's3', content: 'Pupa / Chrysalis', correct_position: 3 },
          { id: 's4', content: 'Adult Butterfly', correct_position: 4 },
        ],
      },
    },
  ],
  'states-of-matter': [
    {
      asset_type: 'concept_card' as const,
      asset_subtype: null,
      title: 'States of Matter',
      content_json: {
        tagline: 'Solid, liquid, gas',
        hook_question: 'Why does steam float but ice stays on the table?',
        definition: 'Particles move differently in each state.',
        image_prompt: 'Ice, water, and steam illustrated with arrows',
      },
    },
    {
      asset_type: 'game_questions' as const,
      asset_subtype: 'quick_fire' as const,
      title: 'Matter Quick Fire',
      content_json: {
        questions: [
          { id: 'm1', question: 'Ice is a ______', options: ['Gas', 'Liquid', 'Solid', 'Energy'], correct: 'Solid', explanation: 'Ice keeps its shape.' },
        ],
        time_limit: 60,
        question_count: 1,
      },
    },
  ],
};

function deterministicUuid(seed: string) {
  const hash = createHash('md5').update(seed).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

async function seedLessonStructuresAndAssets(
  client: ReturnType<typeof createClient>,
  topicLookup: Record<string, string>
) {
  for (const [slug, spec] of Object.entries(LESSON_SPEC)) {
    const topicId = topicLookup[slug];
    if (!topicId) {
      console.warn(`Skipping lesson structure for slug="${slug}" because the topic id is missing.`);
      continue;
    }

    const { data: structureData, error: structureError } = await client
      .from('topic_lesson_structures')
      .upsert(
        {
          topic_id: topicId,
          age_group: spec.age_group,
          key_stage: spec.key_stage,
          version: 1,
          status: 'live',
          generation_model: 'seeded-lesson',
          spark_json: spec.spark_json,
          explore_json: spec.explore_json,
          anchor_json: spec.anchor_json,
          practise_json: spec.practise_json,
          create_json: spec.create_json,
          check_json: spec.check_json,
          celebrate_json: spec.celebrate_json,
          personalisation_hooks: { tone: 'warm', interest: 'stories' },
          game_type: spec.game_type,
          game_content: spec.game_content,
          quality_score: spec.quality_score,
        },
        { onConflict: 'topic_id,age_group,version' }
      )
      .select()
      .single();

    if (structureError || !structureData) {
      console.error(`Failed to seed lesson structure for "${slug}":`, structureError?.message);
      continue;
    }

    console.log(`Seeded lesson structure for "${slug}" (structure id ${structureData.id})`);

    const assetDefs = ASSET_SPEC[slug as keyof typeof ASSET_SPEC] ?? [];
    for (const asset of assetDefs) {
      const assetId = deterministicUuid(`${slug}-${asset.asset_type}-${asset.title}`);
      const { error: assetError } = await client
        .from('topic_assets')
        .upsert(
          {
            id: assetId,
            topic_id: topicId,
            asset_type: asset.asset_type,
            asset_subtype: asset.asset_subtype,
            title: asset.title,
            content_json: asset.content_json,
            file_url: null,
            thumbnail_url: null,
            age_group: '8-11',
            key_stage: 'KS2',
            status: 'published',
            linked_lesson_id: structureData.id,
          },
          { onConflict: 'id' }
        );

      if (assetError) {
        console.error(`Failed to seed asset "${asset.title}" for "${slug}":`, assetError.message);
      } else {
        console.log(`  Seeded asset "${asset.title}" for "${slug}"`);
      }
    }
  }
}

async function seed() {
  console.log('Starting database seeding for MVP lessons...');
  const topicLookup: Record<string, string> = {};

  // 1. Seed Subjects
  for (const subject of SUBJECTS) {
    const { data, error } = await supabase
      .from('subjects')
      .upsert(subject, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error(`Failed to seed subject ${subject.name}:`, error.message);
      continue;
    }

    console.log(`✔ Seeded subject: ${subject.name} (${data.id})`);

    // 2. Seed Topics for this subject
    const topics = TOPICS_BY_SUBJECT[subject.slug];
    if (topics) {
      for (const topic of topics) {
        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .upsert(
            {
              title: topic.title,
              subject_id: data.id,
              slug: topic.slug,
              description: topic.description,
              order_index: topics.indexOf(topic),
              key_stage: '2', // KS2 for MVP
              estimated_minutes: 20,
            },
            { onConflict: 'subject_id,slug' }
          )
          .select()
          .single();

        if (topicError) {
          console.error(`Failed to seed topic ${topic.title}:`, topicError.message);
        } else {
          topicLookup[topic.slug] = topicData.id;
          console.log(`  ✔ Seeded topic: ${topic.title} (${topicData.id})`);
        }
      }
    }
  }

  await seedLessonStructuresAndAssets(supabase, topicLookup);

  console.log('\n✔ Seeding completed!');
  console.log('\nNext step: Generate additional lesson variations via the admin APIs if needed.');
  console.log('Topics seeded for live lessons:');
  Object.keys(topicLookup).forEach((slug) => console.log(`  - ${slug}`));
}

seed().catch(console.error);
