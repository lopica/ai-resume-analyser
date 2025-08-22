import Navbar from "~/components/Navbar";
import { type FormEventHandler, useState } from "react";
import FileUploader from "~/components/FileUploader";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2Img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";
import {
  useFsUploadMutation,
  useAiFeedbackMutation,
  useKvSetMutation,
} from "~/lib/puterApiSlice";
import { useTranslation } from "react-i18next";

interface HandleAnalyzeProps {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  file: File;
}

const Upload = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { t } = useTranslation();

  // RTK Query mutations
  const [fsUpload] = useFsUploadMutation();
  const [aiFeedback] = useAiFeedbackMutation();
  const [kvSet] = useKvSetMutation();

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobDescription,
    jobTitle,
    file,
  }: HandleAnalyzeProps) => {
    try {
      setIsProcessing(true);

      // Step 1: Upload the PDF file
      setStatusText(t('upload.status.uploading'));
      const uploadedFileResult = await fsUpload([file]).unwrap();
      if (!uploadedFileResult) {
        setStatusText(t('upload.errors.uploadFailed'));
        return;
      }

      // Step 2: Convert PDF to image
      setStatusText(t('upload.status.converting'));
      const imageFile = await convertPdfToImage(file);
      console.log(imageFile);
      if (!imageFile || !imageFile.file) {
        setStatusText(t('upload.errors.convertFailed'));
        return;
      }

      // Step 3: Upload the image
      setStatusText(t('upload.status.uploadingImage'));
      const uploadedImageResult = await fsUpload([imageFile.file]).unwrap();
      if (!uploadedImageResult) {
        setStatusText(t('upload.errors.imageUploadFailed'));
        return;
      }

      // Step 4: Prepare data and save to KV store
      setStatusText(t('upload.status.preparing'));
      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFileResult.path,
        imagePath: uploadedImageResult.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: '',
      };

      await kvSet({
        key: `resume:${uuid}`,
        value: JSON.stringify(data),
      }).unwrap();

      // Step 5: Analyze resume with AI
      setStatusText(t('upload.status.analyzing'));
      const feedbackResult = await aiFeedback({
        path: uploadedFileResult.path,
        message: prepareInstructions({ jobTitle, jobDescription }),
      }).unwrap();

      if (!feedbackResult) {
        setStatusText(t('upload.errors.analysisFailed'));
        return;
      }

      // Step 6: Process feedback and save final result
      const feedbackText = typeof feedbackResult.message.content === 'string'
        ? feedbackResult.message.content
        : feedbackResult.message.content[0].text;

      data.feedback = JSON.parse(feedbackText);
      await kvSet({
        key: `resume:${uuid}`,
        value: JSON.stringify(data),
      }).unwrap();

      setStatusText(t('upload.status.complete'));
      console.log(data);
      navigate(`/resume/${uuid}`);
    } catch (error) {
      console.error('Error during analysis:', error);
      setStatusText(`Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    // Basic validation
    if (!companyName.trim()) {
      alert(t('upload.errors.companyNameRequired'));
      return;
    }
    if (!jobTitle.trim()) {
      alert(t('upload.errors.jobTitleRequired'));
      return;
    }
    if (!jobDescription.trim()) {
      alert(t('upload.errors.jobDescriptionRequired'));
      return;
    }
    if (!file) {
      alert(t('upload.errors.fileRequired'));
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')]">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>{t('upload.heading')}</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" alt="Processing..." />
            </>
          ) : (
            <h2>{t('upload.subheading')}</h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">{t('upload.companyName')}</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder={t('upload.companyName')}
                  id="company-name"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">{t('upload.jobTitle')}</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder={t('upload.jobTitle')}
                  id="job-title"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">{t('upload.jobDescription')}</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder={t('upload.jobDescription')}
                  id="job-description"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">{t('upload.uploadResume')}</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button 
                className="primary-button" 
                type="submit"
                disabled={!file}
              >
                {t('upload.analyzeResume')}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;