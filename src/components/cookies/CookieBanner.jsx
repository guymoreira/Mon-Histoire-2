import Button from '../ui/Button';

function CookieBanner({ show, onAcceptAll, onCustomize }) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-cream shadow-lg p-4 z-50 border-t-2 border-primary-light">
      <div className="max-w-3xl mx-auto">
        <h3 className="text-center text-xl font-bold mb-2">🍪 Nous utilisons des cookies</h3>
        <p className="text-center mb-4">
          Notre application utilise des cookies pour améliorer votre expérience. 
          Vous pouvez personnaliser vos préférences ou accepter tous les cookies.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={onAcceptAll}>Tout accepter</Button>
          <Button variant="secondary" onClick={onCustomize}>Personnaliser</Button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;