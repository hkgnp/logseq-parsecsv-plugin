import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import ProgressBar from './ProgressBar';

const uniqueIdentifier = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '');

const ParseCSV = () => {
  const [selectedFile, setSelectedFile] = useState();
  const [isFilePicked, setIsFilePicked] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [keyValue, setKeyValue] = useState(Date.now());

  const handleFile = (e: any) => {
    setSelectedFile(e.target.files[0]);
    setIsFilePicked(true);
  };

  const parse = async (e) => {
    if (!isFilePicked) {
      logseq.App.showMsg('Please select a file first.', 'error');
      return;
    }

    Papa.parse(selectedFile, {
      complete: async (results) => {
        const response: any[] = results.data;

        if (e.target.name === 'rendered') {
          await logseq.Editor.insertAtEditingCursor(
            `{{renderer :tables_${uniqueIdentifier()}}}`
          );

          const tableBlock = await logseq.Editor.getCurrentBlock();

          const tableOptions = await logseq.Editor.insertBlock(
            tableBlock.uuid,
            'data nosum nostyle',
            { before: false, sibling: false }
          );

          for (let r of response[0]) {
            await logseq.Editor.insertBlock(tableOptions.uuid, r, {
              before: false,
              sibling: false,
            });
          }

          const tableOptionsBlock: BlockEntity = await logseq.Editor.getBlock(
            tableOptions.uuid,
            { includeChildren: true }
          );

          const interval: number = 100 / tableOptionsBlock.children.length;
          for (let i = 0; i < tableOptionsBlock.children.length; i++) {
            setProgressPercentage(
              (progressPercentage) => progressPercentage + interval
            );
            for (let j = 1; j < response.length; j++) {
              await logseq.Editor.insertBlock(
                tableOptionsBlock.children[i]['uuid'],
                response[j][i],
                { before: false, sibling: false }
              );
            }
          }
        } else if (e.target.name === 'markdown') {
          let markdownTable = '';
          for (let r of response) {
            let tmpVar = `|${r.join('|')}|`;
            markdownTable = `${markdownTable}
${tmpVar}`;
          }
          await logseq.Editor.insertAtEditingCursor(markdownTable);
        }
        setKeyValue(Date.now());
        setIsFilePicked(false);
        logseq.hideMainUI();
        await logseq.Editor.restoreEditingCursor();
      },
    });
  };

  return (
    <div className="flex justify-center border" tabIndex={-1}>
      <div className="absolute top-10 bg-white rounded-lg p-3 w-1/3 border flex flex-col">
        <input
          key={keyValue}
          className="mt-5 mb-3 block w-full cursor-pointer bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-transparent text-sm rounded-lg"
          type="file"
          onChange={handleFile}
        />
        <div className="flex gap-3 mb-5 justify-between">
          <button
            name="rendered"
            type="button"
            className="text-sm py-2 px-4 bg-teal-600 hover:bg-blue-700 focus:ring-pink-500 focus:ring-offset-pink-200 text-white w-full transition ease-in duration-200 text-center font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
            onClick={parse}
          >
            To Rendered Table
          </button>
          <button
            name="markdown"
            type="button"
            className="text-sm py-2 px-4 bg-purple-800 hover:bg-blue-700 focus:ring-pink-500 focus:ring-offset-pink-200 text-white w-full transition ease-in duration-200 text-center font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
            onClick={parse}
          >
            To Markdown Table
          </button>
        </div>
        <ProgressBar progressPercentage={progressPercentage} />
      </div>
    </div>
  );
};

export default ParseCSV;
