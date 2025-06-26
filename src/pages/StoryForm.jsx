import Card from '../components/ui/Card';
import StoryFormComponent from '../components/story/StoryForm';

function StoryForm() {
  return (
    <div className="flex justify-center">
      <Card>
        <StoryFormComponent />
      </Card>
    </div>
  );
}

export default StoryForm;