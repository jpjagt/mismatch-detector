import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  label: string;
}

export const FileUpload = ({ onFileSelect, label }: FileUploadProps) => {
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
    multiple: false
  });

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