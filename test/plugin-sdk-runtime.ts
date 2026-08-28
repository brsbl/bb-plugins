export function defineRpcContract<const Contract>(contract: Contract): Contract {
  return contract;
}

export type BbPluginApi = never;
