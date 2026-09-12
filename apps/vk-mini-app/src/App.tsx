import {
  AdaptivityProvider,
  ConfigProvider,
  AppRoot,
  SplitLayout,
  SplitCol,
  View,
  Panel,
  PanelHeader,
  Group,
  SimpleCell,
} from "@vkontakte/vkui";

export default function App() {
  return (
    <ConfigProvider>
      <AdaptivityProvider>
        <AppRoot>
          <SplitLayout>
            <SplitCol>
              <View activePanel="main">
                <Panel id="main">
                  <PanelHeader>Финансовый Круг</PanelHeader>

                  <Group header="Главная">
                    <SimpleCell>Добро пожаловать в VK Mini App!</SimpleCell>
                  </Group>
                </Panel>
              </View>
            </SplitCol>
          </SplitLayout>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}
