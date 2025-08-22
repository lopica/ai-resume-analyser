import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import { useSelector } from "react-redux";
import type { RootState } from "~/lib/store";
import { useFsReadQuery, useKvGetQuery } from "~/lib/puterApiSlice";
import { useTranslation } from "react-i18next";

export const meta = () => [
  { title: "Resumind | Review" },
  { name: "description", content: "Detail overview of your resume" },
];

const Resume = () => {
  const { id } = useParams();
  const { auth } = useSelector((state: RootState) => state.puter);
  const { t } = useTranslation();
  
  // Get resume metadata from KV store
  const { 
    data: resumeMetadata, 
    isFetching: isLoadingMetadata,
    error: metadataError 
  } = useKvGetQuery(`resume:${id}`, {
    skip: !id
  });

  // Parse the resume data to get file paths
  const parsedResumeData = resumeMetadata ? JSON.parse(resumeMetadata) : null;
  
  // Get resume file blob
  const { 
    data: resumeBlobUrl, 
    isFetching: isLoadingResume 
  } = useFsReadQuery({path: parsedResumeData?.resumePath, isPdf: true}, {
    skip: !parsedResumeData?.resumePath
  });

  const { 
    data: imageBlobUrl, 
    isFetching: isLoadingImage 
  } = useFsReadQuery({path: parsedResumeData?.imagePath}, {
    skip: !parsedResumeData?.imagePath
  });

  const [resumeUrl, setResumeURL] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const navigate = useNavigate();

  const isLoadingAny = isLoadingMetadata || isLoadingResume || isLoadingImage;

  useEffect(() => {
    if (!isLoadingAny && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [isLoadingAny, auth.isAuthenticated, navigate, id]);

  useEffect(() => {
    if (resumeBlobUrl && resumeUrl !== resumeBlobUrl) {
      setResumeURL(resumeBlobUrl);
    }
  }, [resumeBlobUrl]);

  // Process image blob when it loads
  useEffect(() => {
    if (imageBlobUrl && imageUrl !== imageBlobUrl) {
      setImageUrl(imageBlobUrl);
    }
  }, [imageBlobUrl]);

  useEffect(() => {
    if (parsedResumeData?.feedback) {
      setFeedback(parsedResumeData.feedback);
      console.log({ 
        feedback: parsedResumeData.feedback 
      });
    }
  }, [isLoadingMetadata]);


  if (metadataError) {
    return (
      <main className="!pt-0">
        <nav className="resume-nav">
          <Link to="/" className="back-button">
            <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
            <span className="text-gray-800 text-sm font-semibold">
              {t('resume.backToHomepage')}
            </span>
          </Link>
        </nav>
        <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{t('resume.errorLoading')}</h2>
          <p className="text-gray-600">{t('resume.unableToLoad')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <button onClick={() => navigate("/")} className="back-button cursor-pointer">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            {t('resume.backToHomepage')}
          </span>
        </button>
      </nav>
      
      {/* Loading state */}
      {(isLoadingAny || !feedback) && (
        <div className="p-4 flex flex-row justify-center">
          <img src="/images/resume-scan-2.gif" className="w-96" alt={t('resume.loading')} />
        </div>
      )}
      
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url(/images/bg-small.svg)] h-[100vh] bg-cover sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  alt="{t('resume.resumePreview')}"
                />
              </a>
            </div>
          )}
        </section>
        
        <section className="feedback-section">
          {feedback && (
            <>
              <h2 className="text-4xl !text-black font-bold">{t('resume.resumeReview')}</h2>
              <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                <Summary feedback={feedback} />
                <ATS
                  score={feedback.ATS.score || 0}
                  suggestions={feedback.ATS.tips || []}
                />
                <Details feedback={feedback} />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;