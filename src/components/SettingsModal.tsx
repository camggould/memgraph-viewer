import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiToken, getApiUrl, setApiToken, setApiUrl } from '@/api/client';

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setUrl(getApiUrl());
      setToken(getApiToken());
    }
  }, [open]);

  const save = () => {
    setApiUrl(url.trim());
    setApiToken(token.trim());
    queryClient.invalidateQueries();
    onClose();
  };

  return (
    <Modal isOpen={open} onOpenChange={(o) => !o && onClose()} size="md">
      <ModalContent>
        <ModalHeader>Server settings</ModalHeader>
        <ModalBody>
          <Input
            label="Server URL"
            placeholder="(same-origin)"
            value={url}
            onValueChange={setUrl}
            description="Leave blank to use the page's origin. Use http://localhost:8080 in dev."
            variant="bordered"
          />
          <Input
            label="Bearer token"
            placeholder="(none)"
            value={token}
            onValueChange={setToken}
            type="password"
            description="Required when memgraph-rest is started with MEMGRAPH_HTTP_TOKEN."
            variant="bordered"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={save}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
