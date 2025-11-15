import dayjs from 'dayjs'

<span className="text-xs text-gray-500 block text-right mt-1">
  {dayjs(message.created_at).format('HH:mm')}
</span>
