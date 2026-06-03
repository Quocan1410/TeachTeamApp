export const SECURITY_QUESTION_COUNT = 4;

export interface SecurityQuestionDefinition {
  id: string;
  text: string;
}

export const SECURITY_QUESTIONS: SecurityQuestionDefinition[] = [
  { id: "birth_city", text: "What city were you born in?" },
  { id: "first_school", text: "What was the name of your first school?" },
  { id: "favorite_book", text: "What is your favorite book?" },
  { id: "childhood_nickname", text: "What was your childhood nickname?" },
  { id: "favorite_teacher", text: "What is the name of your favorite teacher?" },
  { id: "first_pet", text: "What was your first pet's name?" },
  { id: "childhood_street", text: "What street did you grow up on?" },
  { id: "maiden_name", text: "What is your mother's maiden name?" },
  { id: "first_car", text: "What was the model of your first car?" },
  { id: "favorite_movie", text: "What is your favorite movie?" },
];
