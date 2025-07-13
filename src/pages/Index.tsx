import { FitnessTracker } from '@/components/FitnessTracker';
import type { User } from '@supabase/supabase-js';

interface IndexProps {
  user: User;
  onSignOut: () => void;
}

const Index = ({ user, onSignOut }: IndexProps) => {
  return <FitnessTracker user={user} onSignOut={onSignOut} />;
};

export default Index;
