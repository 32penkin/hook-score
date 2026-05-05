export type AuthStackParamList = {
  Auth: undefined;
  GuestVideoPrep: undefined;
  GuestAnalysisResult: { historyItemId?: string } | undefined;
};

export type AppStackParamList = {
  VideoPrep: undefined;
  AnalysisResult: { historyItemId?: string } | undefined;
  History: undefined;
  Settings: undefined;
};
