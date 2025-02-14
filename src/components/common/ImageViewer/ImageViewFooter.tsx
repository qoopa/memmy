import React, { useState } from "react";
import { HStack, useTheme, View } from "native-base";
// eslint-disable-next-line import/no-extraneous-dependencies
import { IconDeviceFloppy, IconShare2 } from "tabler-icons-react-native";
import DialogContainer from "react-native-dialog/lib/Container";
import DialogDescription from "react-native-dialog/lib/Description";
import { useTranslation } from "react-i18next";
import IconButtonWithText from "../IconButtonWithText";
import { onGenericHapticFeedback } from "../../../helpers/HapticFeedbackHelpers";
import downloadAndSaveImage from "../../../helpers/ImageHelper";
import { shareLink } from "../../../helpers/ShareHelper";

interface ImageViewFooterProps {
  source: string;
  visible: boolean;
}

function ImageViewFooter({ source, visible }: ImageViewFooterProps) {
  const [downloading, setDownloading] = useState(false);

  const { t } = useTranslation();
  const theme = useTheme();

  const onSave = async () => {
    onGenericHapticFeedback();
    setDownloading(true);

    try {
      await downloadAndSaveImage(source);
      setDownloading(false);
    } catch (e) {
      setDownloading(false);
    }
  };

  const onShare = async () => {
    setDownloading(true);

    try {
      await shareLink({
        link: source,
        isImage: true,
        callback: () => setDownloading(false),
      });
    } catch (e) {
      setDownloading(false);
    }
  };

  return (
    <View
      position="absolute"
      bottom={0}
      width="100%"
      zIndex={2}
      opacity={visible ? 1 : 0}
    >
      <HStack
        flex={1}
        mb={10}
        mx={10}
        space={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <IconButtonWithText
          onPressHandler={onSave}
          icon={
            <IconDeviceFloppy
              size={38}
              color={theme.colors.app.textSecondary}
            />
          }
        />
        <IconButtonWithText
          onPressHandler={onShare}
          icon={<IconShare2 size={38} color={theme.colors.app.textSecondary} />}
        />
      </HStack>
      <DialogContainer visible={downloading}>
        <DialogDescription>{t("imageView.dialogDesc")}</DialogDescription>
      </DialogContainer>
    </View>
  );
}

export default ImageViewFooter;
