import { useMutation } from '@tanstack/react-query';
import {
  questionImportService,
  type ParseResponse,
} from '@/lib/api/services/seller/question-import.service';

export const useParseQuestionFile = () => {
  return useMutation<ParseResponse, Error, File>({
    mutationFn: (file: File) => questionImportService.parseFile(file),
  });
};
