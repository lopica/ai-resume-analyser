import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect, useState} from "react";
import { useFsReadQuery } from "~/lib/puterApiSlice";
import { useTranslation } from "react-i18next";

const ResumeCard = ({resume}: { resume: Resume }) => {
    // const {fs} = usePuterStore()
    const {data: url} = useFsReadQuery({path: resume.imagePath})
    const [resumeUrl, setResumeUrl] = useState('')
    const { t } = useTranslation()

    useEffect(() => {
    if (!url) return;

    setResumeUrl(url);

    // return () => {
    //   URL.revokeObjectURL(url); 
    // };
  }, [url]);

    return <Link to={`/resume/${resume.id}`} className="resume-card animate-in fade-in duration-1000">
        <div className="resume-card-header">
            <div className="flex flex-col gap-2">
                {resume.companyName && <h2 className="!text-black font-bold break-words">{resume.companyName}</h2>}
                {resume.jobTitle && <h3 className="text-lg break-words text-gray-500">{resume.jobTitle}</h3>}
                {!resume.companyName && !resume.jobTitle && <h2 className="!text-black font-bold">{t('resumeCard.defaultTitle')}</h2>}
            </div>
            <div className="flex-shrink-0">
                <ScoreCircle score={resume.feedback.overallScore}/>
            </div>
        </div>
        {resumeUrl && <div className="gradient-border animate-in fade-in duration-1000">
            <div className="w-full h-full">
                <img
                    src={resumeUrl}
                    alt="resume"
                    className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
                />
            </div>
        </div>}
    </Link>;
}

export default ResumeCard;