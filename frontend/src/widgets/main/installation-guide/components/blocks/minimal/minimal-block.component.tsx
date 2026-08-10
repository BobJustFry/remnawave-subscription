import { Box, Group, Stack, Text } from '@mantine/core'

import { getColorGradient, getLocalizedText } from '@shared/utils/config-parser'
import { ThemeIconShared } from '@shared/ui'

import { IBlockRendererProps } from '../renderer-block.interface'
import classes from './minimal-block.module.css'

export const MinimalBlockRenderer = ({
    blocks,
    isMobile,
    currentLang,
    renderBlockButtons,
    getIconFromLibrary
}: IBlockRendererProps) => {
    return (
        <Stack gap={isMobile ? 'sm' : 'md'}>
            {blocks.map((block, index) => {
                const gradientStyle = getColorGradient(block.svgIconColor)

                return (
                    <Box className={classes.stepBlock} key={index}>
                        <Group gap="xs" mb={isMobile ? 4 : 'xs'} wrap="nowrap">
                            <ThemeIconShared
                                getIconFromLibrary={getIconFromLibrary}
                                gradientStyle={gradientStyle}
                                isMobile={isMobile}
                                svgIconColor={block.svgIconColor}
                                svgIconKey={block.svgIconKey}
                            />
                            <Text
                                c="white"
                                dangerouslySetInnerHTML={{
                                    __html: getLocalizedText(block.title, currentLang)
                                }}
                                fw={500}
                                size={isMobile ? 'sm' : 'md'}
                            />
                        </Group>
                        <Text
                            c="dimmed"
                            dangerouslySetInnerHTML={{
                                __html: getLocalizedText(block.description, currentLang)
                            }}
                            size={isMobile ? 'xs' : 'sm'}
                            style={{ lineHeight: isMobile ? 1.35 : 1.6 }}
                        />
                        {block.buttons.length > 0 && (
                            <Box style={{ marginTop: isMobile ? 6 : 8 }}>
                                {renderBlockButtons(block.buttons, 'subtle')}
                            </Box>
                        )}
                    </Box>
                )
            })}
        </Stack>
    )
}
