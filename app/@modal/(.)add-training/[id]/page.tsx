import { AddTrainingModal } from "./modal";
import SCAddTraining from '@/components/server/SCAddTraining';

export default function AddTraining({ params }: { params: { id: string }}) {
  return (
    <AddTrainingModal id={params.id}>
      <SCAddTraining id={params.id} />
    </AddTrainingModal>
  );
}
