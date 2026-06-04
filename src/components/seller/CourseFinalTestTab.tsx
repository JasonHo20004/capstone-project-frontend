import FinalTestTab from './FinalTestTab';

interface Props {
  courseId: string;
  finalTestId?: string | null;
  onTestLinked: () => void;
}

export function CourseFinalTestTab({ courseId, finalTestId, onTestLinked }: Props) {
  return (
    <FinalTestTab
      courseId={courseId}
      finalTestId={finalTestId}
      onTestLinked={onTestLinked}
    />
  );
}
