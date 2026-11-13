import {
    TSubscriptionPageAppConfig,
    TSubscriptionPageButtonConfig,
    TSubscriptionPagePlatformKey
} from '@remnawave/subscription-page-types'
import {
    Button,
    Card,
    Group,
    NativeSelect,
    Stack,
    Text,
    UnstyledButton
} from '@mantine/core'
import { IconArrowLeft, IconArrowRight, IconCheck, IconDownload } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useClipboard } from '@mantine/hooks'
import { useMemo, useState } from 'react'
import clsx from 'clsx'

import { constructSubscriptionUrl } from '@shared/utils/construct-subscription-url'
import { useSubscription } from '@entities/subscription-info-store'
import { getIconFromLibrary } from '@shared/utils/config-parser'
import { TemplateEngine } from '@shared/utils/template-engine'
import { useAppConfig } from '@entities/app-config-store'
import { vibrate } from '@shared/utils/vibrate'
import { useTranslation } from '@shared/hooks'

import { getWizardDictionary } from './connection-wizard.i18n'
import classes from './connection-wizard.module.css'

/** 1 ask → 2 choose → 3 install (optional) → 4 subscribe */
type WizardStep = 1 | 2 | 3 | 4

interface IProps {
    hasPlatformApps: Record<TSubscriptionPagePlatformKey, boolean>
    isMobile: boolean
    onExit: () => void
    platform: TSubscriptionPagePlatformKey | undefined
}

const TOTAL_STEPS = 4

function collectButtons(
    app: TSubscriptionPageAppConfig,
    types: Array<TSubscriptionPageButtonConfig['type']>
): TSubscriptionPageButtonConfig[] {
    return app.blocks.flatMap((block) =>
        block.buttons.filter((button) => types.includes(button.type))
    )
}

export const ConnectionWizardConnector = (props: IProps) => {
    const { isMobile, hasPlatformApps, platform, onExit } = props

    const { t, currentLang, baseTranslations } = useTranslation()
    const dict = getWizardDictionary(currentLang)

    const { platforms, svgLibrary } = useAppConfig()
    const { copy } = useClipboard({ timeout: 2_000 })
    const subscription = useSubscription()

    const [step, setStep] = useState<WizardStep>(1)
    const [hasClient, setHasClient] = useState<boolean | null>(null)
    const [selectedAppIndex, setSelectedAppIndex] = useState(0)
    const [selectedPlatform, setSelectedPlatform] = useState<TSubscriptionPagePlatformKey>(() => {
        if (platform && hasPlatformApps[platform]) {
            return platform
        }

        const firstAvailable = (
            Object.keys(hasPlatformApps) as TSubscriptionPagePlatformKey[]
        ).find((key) => hasPlatformApps[key])
        return firstAvailable!
    })

    const platformApps = platforms[selectedPlatform]?.apps ?? []
    const selectedApp = platformApps[selectedAppIndex] ?? platformApps[0]

    const installButtons = useMemo(
        () => (selectedApp ? collectButtons(selectedApp, ['external']) : []),
        [selectedApp]
    )

    const subscriptionButtons = useMemo(
        () => (selectedApp ? collectButtons(selectedApp, ['subscriptionLink', 'copyButton']) : []),
        [selectedApp]
    )

    const availablePlatforms = (
        Object.entries(hasPlatformApps) as [TSubscriptionPagePlatformKey, boolean][]
    )
        .filter(([_, hasApps]) => hasApps)
        .map(([platformKey]) => {
            const platformConfig = platforms[platformKey]!
            return {
                value: platformKey,
                label: t(platformConfig.displayName),
                icon: getIconFromLibrary(platformConfig.svgIconKey, svgLibrary)
            }
        })

    const subscriptionUrl = constructSubscriptionUrl(
        window.location.href,
        subscription.user.shortUuid
    )

    const handleButtonClick = (button: TSubscriptionPageButtonConfig) => {
        let formattedUrl: string | undefined

        if (button.type === 'subscriptionLink' || button.type === 'copyButton') {
            formattedUrl = TemplateEngine.formatWithMetaInfo(button.link, {
                username: subscription.user.username,
                subscriptionUrl
            })
        }

        switch (button.type) {
            case 'copyButton': {
                if (!formattedUrl) return
                copy(formattedUrl)
                notifications.show({
                    title: t(baseTranslations.linkCopied),
                    message: t(baseTranslations.linkCopiedToClipboard),
                    color: 'cyan'
                })
                break
            }
            case 'external': {
                window.open(button.link, '_blank')
                break
            }
            case 'subscriptionLink': {
                if (!formattedUrl) return
                window.open(formattedUrl, '_blank')
                break
            }
            default:
                break
        }
    }

    const canContinue = () => {
        if (step === 1) return hasClient !== null
        if (step === 2) return Boolean(selectedApp)
        return true
    }

    const goNext = () => {
        if (!canContinue()) return
        vibrate('tap')

        if (step === 1) {
            setStep(2)
            return
        }

        if (step === 2) {
            // Already installed → skip install step
            setStep(hasClient ? 4 : 3)
            return
        }

        if (step === 3) {
            setStep(4)
            return
        }

        // Browsers allow window.close() only for script-opened windows.
        // Try anyway; if the tab stays open, notify and fall back to classic UI.
        window.close()
        window.setTimeout(() => {
            if (document.visibilityState === 'hidden') return

            notifications.show({
                title: dict.canCloseTab,
                message: dict.canCloseTabHint,
                color: 'cyan'
            })
            onExit()
        }, 250)
    }

    const goBack = () => {
        vibrate([60])

        if (step === 2) {
            setStep(1)
            return
        }

        if (step === 3) {
            setStep(2)
            return
        }

        if (step === 4) {
            // If install was skipped, go back to choose client
            setStep(hasClient ? 2 : 3)
        }
    }

    const renderStepPills = () => (
        <div className={classes.stepTrack}>
            {Array.from({ length: TOTAL_STEPS }, (_, index) => {
                const stepNumber = (index + 1) as WizardStep
                const skippedInstall = hasClient === true && stepNumber === 3 && step === 4
                const done = stepNumber < step || skippedInstall
                const active = stepNumber === step

                return (
                    <span
                        className={clsx(
                            classes.stepPill,
                            active && classes.stepPillActive,
                            done && !active && classes.stepPillDone,
                            skippedInstall && classes.stepPillSkipped
                        )}
                        key={stepNumber}
                    >
                        {stepNumber}
                    </span>
                )
            })}
            <span className={classes.stepMeta}>{dict.stepOf(step, TOTAL_STEPS)}</span>
        </div>
    )

    const renderPlatformSelect = () => {
        if (availablePlatforms.length <= 1) {
            const only = availablePlatforms[0]
            if (!only) return null

            return (
                <Text c="dimmed" size="xs">
                    {dict.detectedPlatform}: {only.label}
                </Text>
            )
        }

        return (
            <NativeSelect
                data={availablePlatforms.map((opt) => ({
                    value: opt.value,
                    label: opt.label
                }))}
                leftSection={
                    <span
                        dangerouslySetInnerHTML={{
                            __html: availablePlatforms.find(
                                (opt) => opt.value === selectedPlatform
                            )!.icon
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: 18,
                            height: 18
                        }}
                    />
                }
                onChange={(event) => {
                    vibrate([80])
                    const value = event.target.value as unknown as TSubscriptionPagePlatformKey
                    setSelectedPlatform(value)
                    setSelectedAppIndex(0)
                }}
                radius="md"
                size="xs"
                value={selectedPlatform}
                w={isMobile ? '100%' : 150}
            />
        )
    }

    const renderAppPicker = () => {
        if (platformApps.length === 0) {
            return (
                <Text c="dimmed" size="sm">
                    {dict.noApps}
                </Text>
            )
        }

        return (
            <div className={classes.appsGrid}>
                {platformApps.map((app: TSubscriptionPageAppConfig, index: number) => {
                    const isActive = index === selectedAppIndex
                    const hasIcon = Boolean(app.svgIconKey)

                    return (
                        <UnstyledButton
                            className={clsx(
                                classes.appButton,
                                isActive && classes.appButtonActive
                            )}
                            key={`${app.name}-${index}`}
                            onClick={() => {
                                vibrate('toggle')
                                setSelectedAppIndex(index)
                            }}
                        >
                            {app.featured && <span className={classes.featuredBadge} />}
                            {hasIcon && (
                                <span
                                    className={classes.bgIcon}
                                    dangerouslySetInnerHTML={{
                                        __html: getIconFromLibrary(app.svgIconKey!, svgLibrary)
                                    }}
                                />
                            )}
                            <span className={classes.appName}>{app.name}</span>
                        </UnstyledButton>
                    )
                })}
            </div>
        )
    }

    const renderActionButtons = (
        buttons: TSubscriptionPageButtonConfig[],
        options: {
            emptyText: string
            primaryType: TSubscriptionPageButtonConfig['type']
        }
    ) => {
        if (buttons.length === 0) {
            return (
                <Text c="dimmed" size="sm">
                    {options.emptyText}
                </Text>
            )
        }

        return (
            <Group gap="sm" wrap="wrap">
                {buttons.map((button, index) => (
                    <Button
                        key={index}
                        leftSection={
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: getIconFromLibrary(button.svgIconKey, svgLibrary)
                                }}
                                style={{ display: 'flex', alignItems: 'center' }}
                            />
                        }
                        onClick={() => {
                            vibrate('tap')
                            handleButtonClick(button)
                        }}
                        radius="md"
                        size={isMobile ? 'md' : 'lg'}
                        variant={button.type === options.primaryType ? 'filled' : 'light'}
                    >
                        {t(button.text)}
                    </Button>
                ))}
            </Group>
        )
    }

    const question =
        step === 1
            ? dict.askInstalledTitle
            : step === 2
              ? hasClient
                  ? dict.chooseInstalledTitle
                  : dict.chooseInstallTitle
              : step === 3
                ? dict.installTitle
                : dict.addSubscriptionTitle

    const hint =
        step === 1
            ? dict.askInstalledDescription
            : step === 2
              ? dict.chooseDescription
              : step === 3
                ? dict.installDescription
                : dict.addSubscriptionDescription

    const continueDisabled = !canContinue()
    const continueLabel = step === 4 ? dict.done : dict.continue

    return (
        <Card p={{ base: 'xs', xs: 'sm', sm: 'lg', md: 'xl' }} radius="lg">
            <Stack gap={isMobile ? 'sm' : 'md'}>
                <div className={classes.header}>
                    <p className={classes.headerTitle}>{dict.title}</p>
                    {renderStepPills()}
                </div>

                <Stack gap={isMobile ? 8 : 10}>
                    <h3 className={classes.question}>{question}</h3>
                    {!isMobile && <p className={classes.hint}>{hint}</p>}

                    {(step === 1 || step === 2) && (
                        <Group justify="flex-start">{renderPlatformSelect()}</Group>
                    )}

                    {step === 1 && (
                        <div className={classes.choiceGrid}>
                            <UnstyledButton
                                className={clsx(
                                    classes.choiceCard,
                                    hasClient === true && classes.choiceCardActive
                                )}
                                onClick={() => {
                                    vibrate('tap')
                                    setHasClient(true)
                                    setStep(2)
                                }}
                            >
                                <IconCheck size={18} />
                                <span className={classes.choiceLabel}>{dict.yesInstalled}</span>
                            </UnstyledButton>

                            <UnstyledButton
                                className={clsx(
                                    classes.choiceCard,
                                    hasClient === false && classes.choiceCardActive
                                )}
                                onClick={() => {
                                    vibrate('tap')
                                    setHasClient(false)
                                    setStep(2)
                                }}
                            >
                                <IconDownload size={18} />
                                <span className={classes.choiceLabel}>{dict.notInstalled}</span>
                            </UnstyledButton>
                        </div>
                    )}

                    {step === 2 && renderAppPicker()}

                    {step === 3 &&
                        (installButtons.length === 0 || !selectedApp ? (
                            <Text c="dimmed" size="sm">
                                {dict.noInstallButtons}
                            </Text>
                        ) : (
                            <Group gap="sm" justify="center" wrap="wrap">
                                {installButtons.map((button, index) => (
                                    <Button
                                        key={index}
                                        leftSection={
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: getIconFromLibrary(
                                                        button.svgIconKey,
                                                        svgLibrary
                                                    )
                                                }}
                                                style={{ display: 'flex', alignItems: 'center' }}
                                            />
                                        }
                                        onClick={() => {
                                            vibrate('tap')
                                            handleButtonClick(button)
                                        }}
                                        radius="md"
                                        size={isMobile ? 'md' : 'lg'}
                                        style={isMobile ? { width: '100%', maxWidth: 360 } : undefined}
                                        variant="filled"
                                    >
                                        {`${t(button.text)} (${selectedApp.name})`}
                                    </Button>
                                ))}
                            </Group>
                        ))}

                    {step === 4 &&
                        (() => {
                            if (!selectedApp || subscriptionButtons.length === 0) {
                                return (
                                    <Text c="dimmed" size="sm">
                                        {dict.noSubscriptionButtons}
                                    </Text>
                                )
                            }

                            const primaryButtons = subscriptionButtons.filter(
                                (button) => button.type === 'subscriptionLink'
                            )
                            const buttonsToShow =
                                primaryButtons.length > 0
                                    ? primaryButtons
                                    : [subscriptionButtons[0]]

                            return (
                                <Group gap="sm" justify="center" wrap="wrap">
                                    {buttonsToShow.map((button, index) => (
                                        <Button
                                            key={index}
                                            leftSection={
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: getIconFromLibrary(
                                                            button.svgIconKey,
                                                            svgLibrary
                                                        )
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                />
                                            }
                                            onClick={() => {
                                                vibrate('tap')
                                                handleButtonClick(button)
                                            }}
                                            radius="md"
                                            size={isMobile ? 'md' : 'lg'}
                                            style={
                                                isMobile ? { width: '100%', maxWidth: 360 } : undefined
                                            }
                                            variant="filled"
                                        >
                                            {dict.addSubscriptionToApp(selectedApp.name)}
                                        </Button>
                                    ))}
                                </Group>
                            )
                        })()}

                    {continueDisabled && step === 2 && (
                        <Text c="dimmed" size="xs">
                            {dict.selectApp}
                        </Text>
                    )}
                </Stack>

                {step > 1 && (
                    <div className={classes.navBar}>
                        <Button
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={goBack}
                            radius="md"
                            size={isMobile ? 'sm' : 'md'}
                            variant="default"
                        >
                            {dict.back}
                        </Button>
                        <Button
                            disabled={continueDisabled}
                            onClick={goNext}
                            radius="md"
                            rightSection={
                                step === 4 ? <IconCheck size={16} /> : <IconArrowRight size={16} />
                            }
                            size={isMobile ? 'sm' : 'md'}
                        >
                            {continueLabel}
                        </Button>
                    </div>
                )}

                <Button
                    className={classes.exitButton}
                    onClick={() => {
                        vibrate([80])
                        onExit()
                    }}
                    radius="md"
                    size="compact-xs"
                    variant="subtle"
                >
                    {dict.exitWizard}
                </Button>
            </Stack>
        </Card>
    )
}
