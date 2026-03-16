export type Goal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'improve_health';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type DietPreference = 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten_free';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Mood = 'great' | 'good' | 'okay' | 'bad';
export type ReminderChannel = 'whatsapp' | 'push' | 'both';
export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  goal?: Goal;
  activity_level?: ActivityLevel;
  diet_preference?: DietPreference;
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fat?: number;
  onboarded?: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  quantity?: number;
  unit?: string;
  mood?: Mood;
  notes?: string;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  bmi?: number;
  notes?: string;
  created_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  date: string;
  bedtime: string;
  wake_time: string;
  duration_hours: number;
  quality: number;
  notes?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface WhatsAppContact {
  id: string;
  user_id: string;
  phone_number: string;
  verified: boolean;
  opt_in: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  type: 'meal' | 'water' | 'weigh_in' | 'custom';
  time: string;
  days: number[];
  channel: ReminderChannel;
  active: boolean;
  created_at: string;
}

export interface WaterLog {
  date: string;
  amount_ml: number;
}

export interface NutritionInfo {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  serving_size?: string;
  barcode?: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  LogMeal: undefined;
  Scan: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type RootNavigatorParamList = {
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
  Main: undefined;
  MealScanner: undefined;
  BarcodeScanner: undefined;
  ScanMenu: undefined;
  AIChat: undefined;
  WeightLog: undefined;
  SleepTracker: undefined;
  GroceryList: undefined;
  WhatsAppSetup: undefined;
  Reminders: undefined;
  Settings: undefined;
  Workout: undefined;
  Pricing: undefined;
};
