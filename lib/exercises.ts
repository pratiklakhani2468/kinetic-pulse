export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  muscleColor: string;
  description: string;
  level: number;
  image: string;
}

export const EXERCISES: Exercise[] = [
  {
    id: "squats",
    name: "Squats",
    muscle: "Quadriceps",
    muscleColor: "#10b981",
    description: "Fundamental compound movement for lower body power.",
    level: 4,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
  },
  {
    id: "pushups",
    name: "Push-Ups",
    muscle: "Pectorals",
    muscleColor: "#4a8cff",
    description: "Classic calisthenic foundation for upper body endurance.",
    level: 2,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
  },
  {
    id: "bicep-curls",
    name: "Bicep Curls",
    muscle: "Biceps Brachii",
    muscleColor: "#ff7043",
    description: "Isolated contraction for upper arm peak development.",
    level: 3,
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80",
  },
  {
    id: "deadlifts",
    name: "Deadlifts",
    muscle: "Posterior Chain",
    muscleColor: "#9b6dfa",
    description: "The king of compound lifts for total body strength.",
    level: 5,
    image: "https://images.unsplash.com/photo-1517963879433-6ad2171073fb?w=600&q=80",
  },
  {
    id: "lunges",
    name: "Lunges",
    muscle: "Glutes & Quads",
    muscleColor: "#4ade80",
    description: "Unilateral movement for balance and lower body symmetry.",
    level: 3,
    image: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=600&q=80",
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    muscle: "Deltoids",
    muscleColor: "#fbbf24",
    description: "Overhead pressing for shoulder mass and stability.",
    level: 4,
    image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=600&q=80",
  },
];
