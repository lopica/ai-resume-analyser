import {Link} from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setLanguage } from "../lib/langSlice";
import type { RootState } from "../lib/store";
import { useTranslation } from "react-i18next";

const Navbar = () => {
    const dispatch = useDispatch();
    const lang = useSelector((state: RootState) => state.lang.lang);
    const { t } = useTranslation();

    const handleLanguageChange = (language: "vi" | "en") => {
        dispatch(setLanguage(language));
    };

    return <nav className="navbar">
        <Link to="/">
            <p className="text-2xl font-bold text-gradient">{t('navbar.brandName')}</p>
        </Link>
        <div className="flex items-center gap-4">
            <button 
                className={`text-2xl hover:scale-110 transition-transform ${lang === 'vi' ? 'opacity-100' : 'opacity-50'}`}
                onClick={() => handleLanguageChange('vi')}
            >
                🇻🇳
            </button>
            <button 
                className={`text-2xl hover:scale-110 transition-transform ${lang === 'en' ? 'opacity-100' : 'opacity-50'}`}
                onClick={() => handleLanguageChange('en')}
            >
                🇺🇸
            </button>
            <Link to="/upload" className="primary-button w-fit">
                {t('navbar.uploadResume')}
            </Link>
        </div>
    </nav>
}

export default Navbar;