import { TSubscriptionPageLanguageCode } from '@remnawave/subscription-page-types'

type WizardDict = {
    title: string
    stepOf: (step: number, total: number) => string
    askInstalledTitle: string
    askInstalledDescription: string
    yesInstalled: string
    notInstalled: string
    chooseInstalledTitle: string
    chooseInstallTitle: string
    chooseDescription: string
    continue: string
    done: string
    addSubscriptionTitle: string
    addSubscriptionDescription: string
    addSubscriptionToApp: (appName: string) => string
    installTitle: string
    installDescription: string
    exitWizard: string
    back: string
    detectedPlatform: string
    selectAnswer: string
    selectApp: string
    noApps: string
    noInstallButtons: string
    noSubscriptionButtons: string
    canCloseTab: string
    canCloseTabHint: string
}

const en: WizardDict = {
    title: 'Connection wizard',
    stepOf: (step, total) => `${step}/${total}`,
    askInstalledTitle: 'Do you already have a VPN client installed?',
    askInstalledDescription: 'Tap an option to continue.',
    yesInstalled: 'Yes, installed',
    notInstalled: 'No, need to install',
    chooseInstalledTitle: 'Which client do you use?',
    chooseInstallTitle: 'Which client do you want to install?',
    chooseDescription: 'Pick an app for your platform.',
    continue: 'Continue',
    done: 'Done',
    addSubscriptionTitle: 'Add subscription',
    addSubscriptionDescription: 'Tap the button below to open the app with your subscription.',
    addSubscriptionToApp: (appName) => `Add subscription to ${appName}`,
    installTitle: 'Install the client',
    installDescription: 'Download the app, install it, then continue.',
    exitWizard: 'Exit wizard',
    back: 'Back',
    detectedPlatform: 'Device',
    selectAnswer: 'Choose an option to continue',
    selectApp: 'Choose a client to continue',
    noApps: 'No apps are configured for this platform yet.',
    noInstallButtons: 'No download links are configured for this app.',
    noSubscriptionButtons: 'No subscription buttons are configured for this app.',
    canCloseTab: 'You can close this tab',
    canCloseTabHint: 'Setup is complete. Close the page manually if it did not close automatically.'
}

const ru: WizardDict = {
    title: 'Мастер подключения',
    stepOf: (step, total) => `${step}/${total}`,
    askInstalledTitle: 'VPN-клиент уже установлен?',
    askInstalledDescription: 'Нажмите нужный вариант — сразу перейдёте дальше.',
    yesInstalled: 'Да, установлен',
    notInstalled: 'Нет, нужно установить',
    chooseInstalledTitle: 'Какой клиент вы используете?',
    chooseInstallTitle: 'Какой клиент установить?',
    chooseDescription: 'Выберите приложение для вашей платформы.',
    continue: 'Продолжить',
    done: 'Готово',
    addSubscriptionTitle: 'Добавьте подписку',
    addSubscriptionDescription: 'Нажмите кнопку ниже — откроется приложение с подпиской.',
    addSubscriptionToApp: (appName) => `Добавить подписку в ${appName}`,
    installTitle: 'Установите клиент',
    installDescription: 'Скачайте и установите приложение, затем нажмите «Продолжить».',
    exitWizard: 'Выйти из мастера',
    back: 'Назад',
    detectedPlatform: 'Устройство',
    selectAnswer: 'Выберите вариант, чтобы продолжить',
    selectApp: 'Выберите клиент, чтобы продолжить',
    noApps: 'Для этой платформы приложения пока не настроены.',
    noInstallButtons: 'Для этого приложения нет ссылок на установку.',
    noSubscriptionButtons: 'Для этого приложения нет кнопок добавления подписки.',
    canCloseTab: 'Можно закрыть вкладку',
    canCloseTabHint: 'Настройка завершена. Если окно не закрылось само — закройте страницу вручную.'
}

const dictionaries: Partial<Record<TSubscriptionPageLanguageCode, WizardDict>> & {
    en: WizardDict
    ru: WizardDict
} = {
    en,
    ru
}

export function getWizardDictionary(lang: TSubscriptionPageLanguageCode): WizardDict {
    if (dictionaries[lang]) {
        return dictionaries[lang]!
    }

    if (String(lang).startsWith('ru')) {
        return ru
    }

    return en
}
