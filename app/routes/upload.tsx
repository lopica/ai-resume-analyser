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
      setStatusText("Uploading the file ...");
      const uploadedFileResult = await fsUpload([file]).unwrap();
      if (!uploadedFileResult) {
        setStatusText('Error: Failed to upload file');
        return;
      }

      // Step 2: Convert PDF to image
      setStatusText('Converting to image ...');
      const imageFile = await convertPdfToImage(file);
      console.log(imageFile);
      if (!imageFile || !imageFile.file) {
        setStatusText('Error: Failed to convert PDF to image');
        return;
      }

      // Step 3: Upload the image
      setStatusText('Uploading the image ...');
      const uploadedImageResult = await fsUpload([imageFile.file]).unwrap();
      if (!uploadedImageResult) {
        setStatusText('Error: Failed to upload image');
        return;
      }

      // Step 4: Prepare data and save to KV store
      setStatusText('Preparing data ...');
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
      setStatusText('Analyzing ...');
      const feedbackResult = await aiFeedback({
        path: uploadedFileResult.path,
        message: prepareInstructions({ jobTitle, jobDescription }),
      }).unwrap();

      if (!feedbackResult) {
        setStatusText('Error: Failed to analyze resume');
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

      setStatusText('Analysis complete, redirecting ...');
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
      alert('Please enter a company name');
      return;
    }
    if (!jobTitle.trim()) {
      alert('Please enter a job title');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }
    if (!file) {
      alert('Please select a resume file');
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')]">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" alt="Processing..." />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button 
                className="primary-button" 
                type="submit"
                disabled={!file}
              >
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;