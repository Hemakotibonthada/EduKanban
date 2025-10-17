import React from 'react';
import { Send, Smile, Paperclip, Mic, VideoIcon, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  handleSendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  onEmojiClick,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  onFileClick,
  onStartVoiceRecording,
  onStartVideoRecording,
  isRecording = false,
  recordingTime = 0
}) => {
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Reply/Edit Banner */}
      {(replyingTo || editingMessage) && (
        <div className="mb-2 flex items-center justify-between bg-blue-50 p-2 rounded">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-600 font-medium">
              {editingMessage ? '✏️ Editing message' : '↩️ Replying to'}
            </span>
            <span className="text-sm text-gray-600 truncate max-w-xs">
              {replyingTo?.content || editingMessage?.content}
            </span>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recording Status */}
      {isRecording && (
        <div className="mb-2 flex items-center justify-center space-x-2 bg-red-50 p-2 rounded">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-600 font-medium">
            Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        {/* Attachment Buttons */}
        <div className="flex space-x-1">
          <button
            onClick={onFileClick}
            disabled={isRecording}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isRecording}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isRecording}
            placeholder={isRecording ? "Stop recording to send text..." : "Type a message..."}
            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50"
            rows="2"
          />
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 right-0 z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>

        {/* Voice/Video Buttons */}
        {!newMessage.trim() && !isRecording && (
          <div className="flex space-x-1">
            <button
              onClick={onStartVoiceRecording}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Voice message"
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <button
              onClick={onStartVideoRecording}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Video message"
            >
              <VideoIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Send Button */}
        {(newMessage.trim() || isRecording) && (
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !isRecording}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
