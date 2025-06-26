import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center pt-[15vh]">
      <Card className="text-center">
        <h1 className="text-4xl font-bold mb-6">Mon Histoire</h1>
        
        <div className="flex flex-col gap-4 items-center">
          <Button 
            onClick={() => navigate('/create-story')}
            className="max-w-xs"
          >
            Créer une histoire
          </Button>
          
          {!currentUser && (
            <Button 
              variant="secondary" 
              onClick={() => navigate('/login')}
              className="max-w-xs"
            >
              Me connecter
            </Button>
          )}
          
          {currentUser && (
            <Button 
              variant="secondary" 
              onClick={() => navigate('/my-stories')}
              className="max-w-xs"
            >
              Mes Histoires
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Home;