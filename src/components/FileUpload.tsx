import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Upload, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  label: string;
  uploadedFileName?: string;
  onReset?: () => void;
}

export const FileUpload = ({ onFileSelect, label, uploadedFileName, onReset }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: !!uploadedFileName
  });

  if (uploadedFileName) {
    return (
      <Card className="p-6 border bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{label}</p>
              <p className="text-sm text-green-600">{uploadedFileName}</p>
            </div>
          </div>
          {onReset && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="text-green-700 hover:text-green-800 hover:bg-green-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      {...getRootProps()}
      className={`p-8 border-2 border-dashed cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2 text-gray-600">
        <Upload className="w-8 h-8" />
        <p className="text-sm">{label}</p>
        <p className="text-xs text-gray-400">Drop your CSV file here or click to browse</p>
      </div>
    </Card>
  );
};