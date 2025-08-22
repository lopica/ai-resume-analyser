import {useEffect} from "react";
import {useLocation, useNavigate} from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "~/lib/store";
import { useSignInMutation, useSignOutMutation } from "~/lib/puterApiSlice";
import { useTranslation } from "react-i18next";

export const meta = () => ([
    {title: 'Resumind | Auth'},
    {name: 'description', content: 'Log in your account'}
])

const Auth = () => {
    const auth = useSelector((state: RootState) => state.puter.auth)
    const [signIn, {isLoading: isSignInLoading}] = useSignInMutation()
    const [signOut, {isLoading: isSignOutLoading}] = useSignOutMutation()
    const location = useLocation()
    const next = location.search.split('next=')[1]
    const navigate = useNavigate()
    const { t } = useTranslation()

    useEffect(() => {
        if (auth.isAuthenticated) navigate(next)
    }, [auth.isAuthenticated, next]);

    return <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
        <div className="gradient-border shadow-lg">
            <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1>{t('auth.welcome')}</h1>
                    <h2>{t('auth.subtitle')}</h2>
                </div>
                <div>
                    {(isSignInLoading || isSignOutLoading ) ? (
                        <button className="auth-button animate-pulse" data-testid="auth-loading">
                            <p>{t('auth.signingIn')}</p>
                        </button>
                    ) : auth.isAuthenticated ? (
                        <button className="auth-button" onClick={() => signOut()} data-testid="sign-out-button">
                            <p>{t('auth.logOut')}</p>
                        </button>
                    ) : (
                        <button className="auth-button" onClick={() => signIn()} data-testid="sign-in-button">
                            <p>{t('auth.logIn')}</p>
                        </button>
                    )}

                </div>
            </section>
        </div>
    </main>
}

export default Auth