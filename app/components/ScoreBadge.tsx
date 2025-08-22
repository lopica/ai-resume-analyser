
import { useTranslation } from "react-i18next";

const ScoreBadge = ({score}: {score: number}) => {
    const { t } = useTranslation();
    let badgeColor = ""
    let badgeText = ""

    if (score > 70) {
        badgeColor = "bg-badge-green text-green-600"
        badgeText = t('scoreBadge.strong')
    } else if (score > 49) {
        badgeColor = "bg-badge-yellow text-yellow-600"
        badgeText = t('scoreBadge.goodStart')
    } else {
        badgeColor = "bg-badge-red text-red-600"
        badgeText = t('scoreBadge.needsWork')
    }

    return <div className={`px-3 py-1 rounded-full ${badgeColor}`} data-testid="score-badge">
        <p className="text-sm font-medium">{badgeText}</p>
    </div>
}

export default ScoreBadge