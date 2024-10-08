import { Action, ActionPanel, Form, showToast, Toast, showHUD, getPreferenceValues } from "@raycast/api";
import { useForm, FormValidation, useLocalStorage } from "@raycast/utils";
import webpush, { PushSubscription } from "web-push";

interface NotificationFormValues {
  title: string;
  body: string;
}

export default function SendNotification() {
  const { privateKey, publicKey, email, p256dh, auth, endpoint } = getPreferenceValues<Preferences>();

  const { value: vapidKeys, isLoading } = useLocalStorage<Preferences>("vapid-keys", {
    email: "",
    publicKey: "",
    privateKey: "",
    endpoint: "",
    p256dh: "",
    auth: "",
  });

  const { handleSubmit, itemProps } = useForm<NotificationFormValues>({
    async onSubmit(values) {
      if (!vapidKeys || isLoading) {
        await showHUD("No VAPID keys available");
        throw new Error("No VAPID keys available");
      }

      webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);

      const subscription: PushSubscription = {
        endpoint: endpoint,
        keys: {
          p256dh: p256dh,
          auth: auth,
        },
      };

      console.log("Sending notification", {
        subscription,
      });

      if (!subscription) {
        await showHUD("No subscription available");
        throw new Error("No subscription available");
      }

      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Sending notification",
      });

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: values.title,
            body: values.body,
            icon: "/icon.png",
          }),
        );

        toast.style = Toast.Style.Success;
        toast.title = "Sent notification";
        toast.message = "Notification sent successfully";

        await showHUD("Notification sent");
      } catch (error) {
        console.error("Error sending push notification:", error);
        toast.style = Toast.Style.Failure;
        toast.title = "Failed";
        toast.message = "Failed to send notification";
      }
    },
    validation: {
      title: FormValidation.Required,
      body: FormValidation.Required,
    },
  });

  return (
    <Form
      enableDrafts={true}
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Send Notification" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField title="Title" placeholder="Enter title" {...itemProps.title} />
      <Form.TextField title="Body" placeholder="Enter body" {...itemProps.body} />
    </Form>
  );
}
