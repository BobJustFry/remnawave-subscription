import { Stack, Text, Timeline } from '@mantine/core'

import { getColorGradientSolid, getLocalizedText } from '@shared/utils/config-parser'
import { ThemeIconShared } from '@shared/ui'

import { IBlockRendererProps } from '../renderer-block.interface'
import classes from './timeline-block.module.css'

export const TimelineBlockRenderer = ({
    blocks,
    isMobile,
    currentLang,
    renderBlockButtons,
    getIconFromLibrary
}: IBlockRendererProps) => {
    return (
        <Timeline
            active={blocks.length}
            bulletSize={isMobile ? 28 : 44}
            classNames={{
                root: classes.timelineRoot,
                item: classes.timelineItem,
                itemBullet: classes.timelineItemBullet
            }}
            color="cyan"
            lineWidth={isMobile ? 1.5 : 2}
        >
            {blocks.map((block, index) => {
                const gradientStyle = getColorGradientSolid(block.svgIconColor)

                return (
                    <Timeline.Item
                        bullet={
                            <ThemeIconShared
                                getIconFromLibrary={getIconFromLibrary}
                                gradientStyle={gradientStyle}
                                isMobile={isMobile}
                                svgIconColor={block.svgIconColor}
                                svgIconKey={block.svgIconKey}
                            />
                        }
                        key={index}
                        title={
                            <Text
                                c="white"
                                dangerouslySetInnerHTML={{
                                    __html: getLocalizedText(block.title, currentLang)
                                }}
                                fw={600}
                                size={isMobile ? 'sm' : 'md'}
                            />
                        }
                    >
                        <Stack gap={isMobile ? 6 : 'xs'}>
                            <Text
                                c="dimmed"
                                dangerouslySetInnerHTML={{
                                    __html: getLocalizedText(block.description, currentLang)
                                }}
                                size={isMobile ? 'xs' : 'sm'}
                                style={{ lineHeight: isMobile ? 1.35 : 1.6 }}
                            />
                            {renderBlockButtons(block.buttons, 'light')}
                        </Stack>
                    </Timeline.Item>
                )
            })}
        </Timeline>
    )
}
