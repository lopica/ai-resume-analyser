import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "~/lib/store";
import { useKvListQuery } from "~/lib/puterApiSlice";
import { useTranslation } from "react-i18next";

export function meta() {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const auth = useSelector((state: RootState) => state.puter.auth);
  const { data, isFetching } = useKvListQuery({
    pattern: "resume:*",
    returnValues: true,
  });
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setResumes([]);
      navigate("/auth?next=/");
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      // const resumes = (await kv.list('resume:*', true)) as KVItem[]

      const parsedResumes = (data as KVItem[])?.map(
        (resume) => JSON.parse(resume.value) as Resume
      );

      console.log(parsedResumes);

      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    };

    if (!isFetching) loadResumes();
  }, [isFetching]);

  return (
    <main className="bg-[url('/images/bg-main.svg')]">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>{t("welcomeMessage")}</h1>
          {!loadingResumes && resumes?.length === 0 ? (
            <h2>{t('home.noResumes')}</h2>
          ) : (
            <></>
          )}
          <h2>{t('home.reviewSubmissions')}</h2>
        </div>
        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {!loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link
              to="/upload"
              className="primary-button w-fit text-xl font-semibold"
            >
              {t('home.uploadResumeButton')}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
