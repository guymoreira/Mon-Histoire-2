import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function NotFound() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="text-center">
        <div className="text-6xl text-primary mb-4">404</div>
        <div className="text-2xl mb-6">Page non trouvée</div>
        <p className="mb-6">Désolé, la page que vous recherchez n'existe pas.</p>
        
        <Link to="/">
          <Button>Retour à l'accueil</Button>
        </Link>
      </Card>
    </div>
  );
}

export default NotFound;