import Card from '../components/ui/Card';
import StoryDisplay from '../components/story/StoryDisplay';

function StoryResult() {
  return (
    <div className="flex justify-center">
      <Card>
        <StoryDisplay />
      </Card>
    </div>
  );
}

export default StoryResult;