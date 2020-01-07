import defaultSettings from '@/settings';

const title = defaultSettings.title || '测试项目';

export default function getPageTitle(pageTitle) {
  if (pageTitle) {
    return pageTitle;
  }
  return title;
}
