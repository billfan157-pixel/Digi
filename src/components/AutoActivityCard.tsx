import { useTranslation } from 'react-i18next';

const AutoActivityCard = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-bold">{t('device.activity_status')}</p>
          <p className="text-slate-400 text-xs mt-1">{t('device.auto_tracking')}</p>
        </div>
      </div>
    </div>
  );
};

export default AutoActivityCard;