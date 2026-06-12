import type { PersonSeed } from "./bootstrapDataset";

export const WAVE_2_LECTURERS: PersonSeed[] = [
    {
        email: "hannah.walsh@lecturer.edu.au",
        firstName: "Hannah",
        lastName: "Walsh",
        honorific: "Dr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Cork" },
            { questionId: "first_school", answer: "Presentation College Cork" },
            { questionId: "favorite_book", answer: "The Rule of Law" },
            { questionId: "childhood_nickname", answer: "Han" },
        ],
    },
    {
        email: "tomas.rivera@lecturer.edu.au",
        firstName: "Tomás",
        lastName: "Rivera",
        honorific: "Prof.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Mexico City" },
            { questionId: "first_school", answer: "Colegio Ciudad de México" },
            { questionId: "favorite_book", answer: "The Selfish Gene" },
            { questionId: "childhood_nickname", answer: "Tomy" },
        ],
    },
    {
        email: "yuki.nakamura@lecturer.edu.au",
        firstName: "Yuki",
        lastName: "Nakamura",
        honorific: "Dr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Kyoto" },
            { questionId: "first_school", answer: "Kyoto International School" },
            { questionId: "favorite_book", answer: "The Art of Statistics" },
            { questionId: "childhood_nickname", answer: "Yuk" },
        ],
    },
];

export const WAVE_2_CANDIDATES: PersonSeed[] = [
    {
        email: "zoe.hayes@candidate.edu.au",
        firstName: "Zoe",
        lastName: "Hayes",
        honorific: "Ms.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Hobart" },
            { questionId: "first_school", answer: "Friends School Hobart" },
            { questionId: "favorite_book", answer: "Bad Science" },
            { questionId: "childhood_nickname", answer: "Zo" },
        ],
    },
    {
        email: "ethan.brooks@candidate.edu.au",
        firstName: "Ethan",
        lastName: "Brooks",
        honorific: "Mr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Denver" },
            { questionId: "first_school", answer: "East High School Denver" },
            { questionId: "favorite_book", answer: "Code Complete" },
            { questionId: "childhood_nickname", answer: "E" },
        ],
    },
    {
        email: "priya.nair@candidate.edu.au",
        firstName: "Priya",
        lastName: "Nair",
        honorific: "Ms.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Chennai" },
            { questionId: "first_school", answer: "PSBB Senior Secondary" },
            { questionId: "favorite_book", answer: "Invisible Women" },
            { questionId: "childhood_nickname", answer: "Pri" },
        ],
    },
    {
        email: "hannah.choi@candidate.edu.au",
        firstName: "Hannah",
        lastName: "Choi",
        honorific: "Ms.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Busan" },
            { questionId: "first_school", answer: "Busan International High School" },
            { questionId: "favorite_book", answer: "The Gene" },
            { questionId: "childhood_nickname", answer: "Han" },
        ],
    },
    {
        email: "lucas.mueller@candidate.edu.au",
        firstName: "Lucas",
        lastName: "Mueller",
        honorific: "Mr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Munich" },
            { questionId: "first_school", answer: "Gymnasium München" },
            { questionId: "favorite_book", answer: "Database System Concepts" },
            { questionId: "childhood_nickname", answer: "Lu" },
        ],
    },
    {
        email: "grace.adeyemi@candidate.edu.au",
        firstName: "Grace",
        lastName: "Adeyemi",
        honorific: "Ms.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Accra" },
            { questionId: "first_school", answer: "Ghana International School" },
            { questionId: "favorite_book", answer: "Thinking in Systems" },
            { questionId: "childhood_nickname", answer: "Gracie" },
        ],
    },
    {
        email: "ryan.obrien@candidate.edu.au",
        firstName: "Ryan",
        lastName: "O'Brien",
        honorific: "Mr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Galway" },
            { questionId: "first_school", answer: "Coláiste Iognáid" },
            { questionId: "favorite_book", answer: "Justice" },
            { questionId: "childhood_nickname", answer: "Ry" },
        ],
    },
    {
        email: "sofia.rossi@candidate.edu.au",
        firstName: "Sofia",
        lastName: "Rossi",
        honorific: "Ms.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Milan" },
            { questionId: "first_school", answer: "Liceo Classico Berchet" },
            { questionId: "favorite_book", answer: "Organic Chemistry" },
            { questionId: "childhood_nickname", answer: "Sofi" },
        ],
    },
    {
        email: "noah.park@candidate.edu.au",
        firstName: "Noah",
        lastName: "Park",
        honorific: "Mr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Seattle" },
            { questionId: "first_school", answer: "Garfield High School" },
            { questionId: "favorite_book", answer: "An Introduction to Statistical Learning" },
            { questionId: "childhood_nickname", answer: "N" },
        ],
    },
];
