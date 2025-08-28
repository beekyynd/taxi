import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Keyboard } from 'react-native';
import { commonStyles } from '../../styles/commonStyle';
import { external } from '../../styles/externalStyle';
import { Back, Send, Emoji } from '@utils/icons';
import { appColors } from '@src/themes';
import { useValues } from '../../../App';
import { styles } from './styles';
import EmojiPicker from 'rn-emoji-keyboard';
import Voice from '@react-native-voice/voice';
import Images from '@utils/images';
import { useAppNavigation } from '@src/utils/navigation';
import '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import { useRoute, useTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export function ChatScreen() {
  const { goBack } = useAppNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { driverId, riderId, rideId, driverName, driverImage, from, setUnreadCount } = route.params || {};
  const [isOpen, setIsOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { translateData } = useSelector(state => state.setting);
  const { self } = useSelector((state: any) => state.account);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState<string>('');
  const { bgFullStyle, bgFullLayout, textColorStyle, viewRTLStyle, textRTLStyle, bgContainer, isDark, isRTL } = useValues();
  const inputRef = useRef<TextInput>(null);
  const [isMessagesFetched, setIsMessagesFetched] = useState(false);




  const handlePick = (emoji: { emoji: string }): void => {
    if (emoji && emoji.emoji) {
      setInput(prev => prev + emoji.emoji);
      setIsOpen(false);
      inputRef.current?.focus();
    }
  };

  const onSpeechStart = () => {
    setStarted(true);
  };

  const onSpeechEnd = () => {
    setStarted(false);
  };

  const onSpeechResults = (e: any) => {
    if (e.value && e.value.length > 0) {
      setResults(e.value);
    }
  };

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const ride_Id = `${rideId}`;
  const currentUserId = `${riderId}`;
  const chatWithUserId = `${driverId}`;
  const adminId = 1;

  const chatId =
    from && from === 'help'
      ? [adminId, currentUserId].sort().join('_')
      : [ride_Id, currentUserId, chatWithUserId].sort().join('_');

  const messagesRef = firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages');

  useEffect(() => {
    const unsubscribeMessages = messagesRef
      .orderBy('timestamp', 'desc')
      .onSnapshot(
        snapshot => {
          const fetchedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(fetchedMessages);
          setIsMessagesFetched(true);
        },
      );

    return () => {
      unsubscribeMessages();
    };
  }, [chatId]);


  useEffect(() => {
    if (!chatId || !currentUserId) return;

    firestore()
      .collection('chats')
      .doc(chatId)
      .update({
        [`unreadCount.${currentUserId}`]: 0
      })
      .catch(err => console.log("Error resetting unread count:", err));

  }, [chatId, currentUserId]);



  const sendMessage = async () => {
    if (from === "help") {
      if (input.trim()) {
        const messageData = {
          message: input,
          senderId: currentUserId,
          senderName: self?.name,
          timestamp: firestore.FieldValue.serverTimestamp(),
        };

        const lastMessageData = {
          message: input,
          senderId: currentUserId,
          senderName: self?.name,
          receiverName: "administrator",
          timestamp: firestore.FieldValue.serverTimestamp(),
        };
        setInput('')
        const participants = [String(adminId), currentUserId]
        const unreadCount = { 1: 1, [currentUserId]: 0 }

        try {
          await messagesRef.add(messageData);
          await firestore()
            .collection('chats')
            .doc(chatId)
            .set({ lastMessage: lastMessageData, participants: participants, unreadCount: unreadCount });

          setInput('');
        } catch (error) {
        }
      }
    } else {
      if (input.trim()) {
        try {
          await messagesRef.add({
            message: input,
            senderId: currentUserId,
            senderName: self?.name,
            timestamp: firestore.FieldValue.serverTimestamp(),
          });
          setInput('');
        } catch (error) {
        }
      }
    }
  };

  return (
    <View style={[commonStyles.flexContainer]}>
      <View
        style={[
          styles.view_Main,
          { backgroundColor: bgFullStyle, flexDirection: viewRTLStyle },
        ]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.backButton,
            { borderColor: isDark ? appColors.darkBorder : appColors.border },
            { backgroundColor: isDark ? bgContainer : appColors.lightGray },
          ]}
          onPress={goBack}>
          <Back />
        </TouchableOpacity>
        <View style={[external.mh_10, external.fg_1]}>
          <Text
            style={[
              styles.templetionStyle,
              { color: textColorStyle, textAlign: textRTLStyle },
            ]}>
            {from && from === "help" ? "Administrator" : driverName}
          </Text>
          <Text
            style={[
              commonStyles.mediumTextBlack12,
              external.mt_2,
              { color: appColors.primary, textAlign: textRTLStyle },
            ]}>
            {translateData.online}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: isDark ? appColors.primaryText : appColors.lightGray,
          flex: 1
        }}>
        <FlatList
          inverted
          data={messages}
          keyExtractor={item => item.id}
          style={styles.listStyle}
          renderItem={({ item }) => {
            const timestamp = item.timestamp
              ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
              : `${translateData.sending}`;

            return (
              <View
                style={[
                  styles.mainView,
                  {
                    flexDirection: item.senderId === currentUserId ? 'row-reverse' : 'row',
                  },
                ]}
              >
                {item.senderId !== currentUserId && (
                  <Image
                    source={driverImage ? { uri: driverImage } : Images.defultImage}
                    style={[
                      styles.imageStyle,
                      {
                        borderColor: colors.border,
                      },
                    ]}
                  />
                )}

                <View
                  style={[
                    styles.messageContainer,
                    item.senderId === currentUserId
                      ? styles.senderMessage
                      : styles.receiverMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      item.senderId !== currentUserId
                        ? styles.senderMessageText
                        : styles.receiverMessageText,
                      { textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {item.message}
                  </Text>
                  <Text
                    style={[
                      styles.messageText,
                      item.senderId !== currentUserId
                        ? styles.senderMessageTime
                        : styles.receiverMessageTime,
                      { textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {timestamp}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            isMessagesFetched && messages.length === 0 ? (
              <TouchableOpacity
                onPress={() => inputRef.current?.focus()}
                style={styles.emptyContainer}
                activeOpacity={0.9}
              >
                <Image
                  source={Images.noChat}
                  style={styles.noChatImage}
                  resizeMode="contain"
                />
                <Text style={[styles.noChatText, { color: isDark ? appColors.lightGray : appColors.primaryText }]}>No Chat yet!</Text>
                <Text style={styles.noChatDetailsText}>
                  {translateData.noChatHistory}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: bgFullLayout },
            { flexDirection: viewRTLStyle },
          ]}>
          <View
            style={[
              styles.textInputView,
              {
                backgroundColor: bgFullStyle,
                flexDirection: viewRTLStyle,
              },
            ]}>
            <View style={styles.inputView}>
              <TouchableOpacity style={styles.emojiView} activeOpacity={0.7} onPress={() => setIsOpen(true)}>
                <Emoji />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  { textAlign: textRTLStyle },
                  { color: textColorStyle },
                ]}
                value={input}
                onChangeText={setInput}
                placeholder={translateData.typeHere}
                multiline
                placeholderTextColor={appColors.subtitle}
              />
            </View>
            <View style={styles.sendBtnView}>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                activeOpacity={0.7}>
                <Send />
              </TouchableOpacity>
            </View>
          </View>

        </View>
        {isOpen && (
          <View>
            <EmojiPicker
              onEmojiSelected={handlePick}
              open={isOpen}
              onClose={() => setIsOpen(false)}
            />
          </View>
        )}
      </View>
    </View>
  );
}
