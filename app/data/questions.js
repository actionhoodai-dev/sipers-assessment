export const SECTIONS = [
  {
    id: 'a',
    title: 'Communication Skills',
    description:
      'Evaluate the child\'s ability to communicate effectively with peers in various social contexts.',
    questions: [
      { id: 'a_0', text: 'The child initiates conversation with peers appropriately' },
      { id: 'a_1', text: 'The child responds when spoken to by peers' },
      { id: 'a_2', text: 'The child uses appropriate verbal communication during social interactions' },
      { id: 'a_3', text: 'The child uses appropriate non-verbal communication (gestures, facial expressions)' },
      { id: 'a_4', text: 'The child takes turns during conversations' },
      { id: 'a_5', text: 'The child adjusts communication style based on the social context' },
    ],
  },
  {
    id: 'b',
    title: 'Emotional Expression',
    description:
      'Assess how the child expresses and manages emotions during interactions with peers.',
    questions: [
      { id: 'b_0', text: 'The child expresses emotions appropriately in social settings' },
      { id: 'b_1', text: 'The child recognizes and responds to the emotions of peers' },
      { id: 'b_2', text: 'The child manages frustration or disappointment during peer interactions' },
      { id: 'b_3', text: 'The child shows empathy towards peers in distress' },
      { id: 'b_4', text: 'The child expresses joy or excitement appropriately during group activities' },
    ],
  },
  {
    id: 'c',
    title: 'Attitude and Cooperative Behaviour',
    description:
      'Measure the child\'s willingness to cooperate and maintain a positive attitude in group settings.',
    questions: [
      { id: 'c_0', text: 'The child follows group rules and instructions during activities' },
      { id: 'c_1', text: 'The child shares materials and resources with peers willingly' },
      { id: 'c_2', text: 'The child waits for their turn during group activities' },
      { id: 'c_3', text: 'The child accepts feedback or suggestions from peers gracefully' },
      { id: 'c_4', text: 'The child shows a positive attitude toward participating in group tasks' },
    ],
  },
  {
    id: 'd',
    title: 'Social Interaction and Teamwork',
    description:
      'Evaluate the child\'s participation and collaborative skills in team-based activities.',
    questions: [
      { id: 'd_0', text: 'The child actively participates in group activities' },
      { id: 'd_1', text: 'The child collaborates with peers to complete tasks' },
      { id: 'd_2', text: 'The child contributes ideas during group discussions' },
      { id: 'd_3', text: 'The child supports and encourages peers during teamwork' },
      { id: 'd_4', text: 'The child adapts to different roles within a group setting' },
    ],
  },
  {
    id: 'e',
    title: 'Peer Relationships',
    description:
      'Assess the quality and nature of the child\'s relationships with peers.',
    questions: [
      { id: 'e_0', text: 'The child forms and maintains friendships with peers' },
      { id: 'e_1', text: 'The child is accepted and included by peers in activities' },
      { id: 'e_2', text: 'The child resolves conflicts with peers in a constructive manner' },
      { id: 'e_3', text: 'The child shows interest in engaging with peers during free time' },
    ],
  },
];

export const RESPONSE_OPTIONS = [
  'Never',
  'Rarely',
  'Sometimes',
  'Often',
  'Always',
];

export const CHILD_FIELDS = [
  {
    id: 'childName',
    label: 'Child Name',
    type: 'text',
    placeholder: "Enter child's full name",
    required: true,
  },
  {
    id: 'age',
    label: 'Age',
    type: 'text',
    placeholder: 'e.g., 5 years 3 months',
    required: true,
  },
  {
    id: 'gender',
    label: 'Gender',
    type: 'select',
    placeholder: 'Select gender',
    required: true,
    options: ['Male', 'Female', 'Other'],
  },
  {
    id: 'diagnosis',
    label: 'Diagnosis',
    type: 'text',
    placeholder: 'e.g., ASD, ADHD, etc.',
    required: true,
  },
  {
    id: 'ses',
    label: 'Socio Economic Status',
    type: 'select',
    placeholder: 'Select SES',
    required: true,
    options: ['Lower', 'Lower Middle', 'Middle', 'Upper Middle', 'Upper'],
  },
  {
    id: 'locationType',
    label: 'Location Type',
    type: 'select',
    placeholder: 'Select location type',
    required: true,
    options: ['Rural', 'Semi Urban', 'Urban'],
  },
  {
    id: 'familyType',
    label: 'Family Type',
    type: 'select',
    placeholder: 'Select family type',
    required: true,
    options: ['Nuclear', 'Joint'],
  },
  {
    id: 'birthOrder',
    label: 'Birth Order',
    type: 'text',
    placeholder: 'e.g., 1st, 2nd, 3rd',
    required: true,
  },
];
