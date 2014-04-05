describe("BasicS3Uploader", function() {

  describe("constructor", function() {
    var uploader, mockFile, mockSettings;

    beforeEach(function() {
      mockFile = {name: "testfile", size: 1000};
      mockSettings = {}

      spyOn(BasicS3Uploader.prototype, '_configureUploader').and.callThrough();
      spyOn(BasicS3Uploader.prototype, '_notifyUploaderReady').and.callThrough();
      spyOn(BasicS3Uploader.prototype, '_setReady').and.callThrough();

      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("stores the provided file on the uploader", function() {
      expect(uploader.file).toEqual(mockFile);
    });

    it("creates a hash to hold all chunk XHR requests", function() {
      expect(uploader._chunkXHRs).toEqual({});
    });

    it("creates an array to hold all other XHR requests", function() {
      expect(uploader._XHRs).toEqual([]);
    });

    it("creates a hash to hold all eTags", function() {
      expect(uploader._eTags).toEqual({});
    });

    it("creates a hash to hold chunk upload progress", function() {
      expect(uploader._chunkProgress).toEqual({});
    });

    it("sets _chunkUploadsInProgress to 0", function() {
      expect(uploader._chunkUploadsInProgress).toEqual(0);
    });

    it("configures the uploader using the provided settings", function() {
      expect(BasicS3Uploader.prototype._configureUploader).toHaveBeenCalled();
    });

    it("notifies that the uploader is ready", function() {
      expect(BasicS3Uploader.prototype._notifyUploaderReady).toHaveBeenCalled();
    });

    it("sets the uploader status to ready", function() {
      expect(BasicS3Uploader.prototype._setReady).toHaveBeenCalled();
    });

  });

  describe("_configureUploader", function() {
    var uploader, mockFile, mockSettings;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        contentType: "video/quicktime",
        chunkSize: 1000,
        encrypted: true,
        maxRetries: 5,
        maxFileSize: 10000,
        acl: "private",
        signatureBackend: "/",
        initSignaturePath: "initSignature",
        remainingSignaturesPath: "remainingSignatures",
        bucket: "my-bucket",
        host: "http://my-fake-host.com",
        awsAccessKey: "my-access-key",
        log: true,
        customHeaders: { "X-Test-Header": "True" },
        maxConcurrentChunks: 5,
        xhrRequestTimeout: 7000,
        key: "my-key-for-this-upload",
        onReady: function() {},
        onStart: function() {},
        onProgress: function(loaded, total) {},
        onChunkUploaded: function(chunkNumber, totalChunks) {},
        onComplete: function(location) {},
        onError: function(code, message) {},
        onRetry: function(attempts, data) {},
        onCancel: function() {},
      };

      spyOn(window, 'Date').and.returnValue({
        getTime: function() { return "timestamp"; }
      });

    });

    it("accepts settings from the user and merges them onto the uploader's settings", function() {
      uploader = new BasicS3Uploader(mockFile, mockSettings);

      expect(uploader.settings.contentType).toEqual(mockSettings.contentType);
      expect(uploader.settings.chunkSize).toEqual(mockSettings.chunkSize);
      expect(uploader.settings.encrypted).toEqual(mockSettings.encrypted);
      expect(uploader.settings.maxRetries).toEqual(mockSettings.maxRetries);
      expect(uploader.settings.maxFileSize).toEqual(mockSettings.maxFileSize);
      expect(uploader.settings.acl).toEqual(mockSettings.acl);
      expect(uploader.settings.signatureBackend).toEqual(mockSettings.signatureBackend);
      expect(uploader.settings.initSignaturePath).toEqual(mockSettings.initSignaturePath);
      expect(uploader.settings.remainingSignaturesPath).toEqual(mockSettings.remainingSignaturesPath);
      expect(uploader.settings.bucket).toEqual(mockSettings.bucket);
      expect(uploader.settings.host).toEqual(mockSettings.host);
      expect(uploader.settings.awsAccessKey).toEqual(mockSettings.awsAccessKey);
      expect(uploader.settings.log).toEqual(mockSettings.log);
      expect(uploader.settings.customHeaders).toEqual(mockSettings.customHeaders);
      expect(uploader.settings.maxConcurrentChunks).toEqual(mockSettings.maxConcurrentChunks);
      expect(uploader.settings.xhrRequestTimeout).toEqual(mockSettings.xhrRequestTimeout);
      expect(uploader.settings.key).toEqual(mockSettings.key);
      expect(uploader.settings.onReady).toEqual(mockSettings.onReady);
      expect(uploader.settings.onStart).toEqual(mockSettings.onStart);
      expect(uploader.settings.onProgress).toEqual(mockSettings.onProgress);
      expect(uploader.settings.onChunkUploaded).toEqual(mockSettings.onChunkUploaded);
      expect(uploader.settings.onComplete).toEqual(mockSettings.onComplete);
      expect(uploader.settings.onError).toEqual(mockSettings.onError);
      expect(uploader.settings.onRetry).toEqual(mockSettings.onRetry);
      expect(uploader.settings.onCancel).toEqual(mockSettings.onCancel);
    });

    it("provides a default for every option if no value was provided", function() {
      uploader = new BasicS3Uploader(mockFile, {});

      expect(uploader.settings.contentType).toEqual(mockFile.type);
      expect(uploader.settings.chunkSize).toEqual(1024 * 1024 * 10);
      expect(uploader.settings.encrypted).toBeFalsy();
      expect(uploader.settings.maxRetries).toEqual(5);
      expect(uploader.settings.maxFileSize).toEqual(1024 * 1024 * 1024 * 5);
      expect(uploader.settings.acl).toEqual("public-read");
      expect(uploader.settings.signatureBackend).toEqual("");
      expect(uploader.settings.initSignaturePath).toEqual("/get_init_signature");
      expect(uploader.settings.remainingSignaturesPath).toEqual("/get_remaining_signatures");
      expect(uploader.settings.bucket).toEqual("your-bucket-name");
      expect(uploader.settings.host).toEqual("http://" + uploader.settings.bucket + "." + "s3.amazonaws.com");
      expect(uploader.settings.awsAccessKey).toEqual("YOUR_AWS_ACCESS_KEY_ID");
      expect(uploader.settings.log).toBeFalsy();
      expect(uploader.settings.customHeaders).toEqual({});
      expect(uploader.settings.maxConcurrentChunks).toEqual(5);
      expect(uploader.settings.xhrRequestTimeout).toEqual(30000);
      expect(uploader.settings.key).toEqual("/" + uploader.settings.bucket + "/timestamp_" + uploader.file.name);
      expect(uploader.settings.onReady).toBeDefined();
      expect(uploader.settings.onStart).toBeDefined();
      expect(uploader.settings.onProgress).toBeDefined();
      expect(uploader.settings.onChunkUploaded).toBeDefined();
      expect(uploader.settings.onComplete).toBeDefined();
      expect(uploader.settings.onError).toBeDefined();
      expect(uploader.settings.onRetry).toBeDefined();
      expect(uploader.settings.onCancel).toBeDefined();
    });

  });

  describe("startUpload", function() {
    var uploader, mockSettings, mockFile;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);

      spyOn(uploader, '_getInitSignature');
    });

    describe("when the uploader is already uploading", function() {
      beforeEach(function() {
        spyOn(uploader, '_isUploading').and.returnValue(true);

        uploader.startUpload();
      });

      it("does not get the init signature", function() {
        expect(uploader._getInitSignature).not.toHaveBeenCalled();
      });
    });

    describe("when the uploader is not uploading", function() {
      beforeEach(function() {
        spyOn(uploader, '_isUploading').and.returnValue(false);
      });

      describe("and the file exceeds the max file size", function() {

        beforeEach(function() {
          uploader.settings.maxFileSize = 100;
          spyOn(uploader, '_notifyUploadError');
          spyOn(uploader, '_setFailed');
          spyOn(uploader, '_resetData');
          uploader.startUpload();
        });

        it("does not get the init signature", function() {
          expect(uploader._getInitSignature).not.toHaveBeenCalled();
        });

        it("notifies there was an upload error", function() {
          expect(uploader._notifyUploadError).toHaveBeenCalledWith(0, uploader.errors[0]);
        });

        it("sets the upload to a failed state", function() {
          expect(uploader._setFailed).toHaveBeenCalled();
        });

        it("resets the uploader's data", function() {
          expect(uploader._resetData).toHaveBeenCalled();
        });
      });

      describe("and the file does not exceed the max file size", function() {
        beforeEach(function() {
          uploader.settings.maxFileSize = 9999;
        });

        describe("and the file is not readable", function() {
          beforeEach(function() {
            spyOn(uploader, '_validateFileIsReadable').and.callFake(function(isValidCallback) {
              var validFile = false;
              isValidCallback(validFile);
            });

            spyOn(uploader, '_notifyUploadError');
            spyOn(uploader, '_setFailed');
            spyOn(uploader, '_resetData');

            uploader.startUpload();
          });

          it("does not get the init signature", function() {
            expect(uploader._getInitSignature).not.toHaveBeenCalled();
          });

          it("notifies there was an upload error", function() {
            expect(uploader._notifyUploadError).toHaveBeenCalledWith(1, uploader.errors[1]);
          });

          it("sets the upload to a failed state", function() {
            expect(uploader._setFailed).toHaveBeenCalled();
          });

          it("resets the uploader's data", function() {
            expect(uploader._resetData).toHaveBeenCalled();
          });
        });

        describe("and the file is readable", function() {
          beforeEach(function() {
            spyOn(uploader, '_validateFileIsReadable').and.callFake(function(isValidCallback) {
              var validFile = true;
              isValidCallback(validFile);
            });

            spyOn(uploader, "_createChunks");
            spyOn(uploader, "_notifyUploadStarted");
            spyOn(uploader, "_setUploading");

            uploader.startUpload();
          });

          it("slices up the file into chunks", function() {
            expect(uploader._createChunks).toHaveBeenCalled();
          });

          it("notifies that the upload has started", function() {
            expect(uploader._notifyUploadStarted).toHaveBeenCalled();
          });

          it("sets the uploader to an uploading state", function() {
            expect(uploader._setUploading).toHaveBeenCalled();
          });

          it("calls to get the init signature", function() {
            expect(uploader._getInitSignature).toHaveBeenCalled();
          });
        });

      });
    });

  });

  describe("cancelUpload", function() {
    var uploader, mockSettings, mockFile,
    mockAjax1, mockAjax2, mockAjax3;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};

      mockAjax1 = { abort: function() {} };
      mockAjax2 = { abort: function() {} };
      mockAjax3 = { abort: function() {} };

      spyOn(mockAjax1, 'abort');
      spyOn(mockAjax2, 'abort');
      spyOn(mockAjax3, 'abort');

      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._XHRs = [mockAjax1];
      uploader._chunkXHRs = {
        1: mockAjax2,
        2: mockAjax3,
      };
    });

    describe("when the uploader is not uploading", function() {
      beforeEach(function() {
        spyOn(uploader, '_isUploading').and.returnValue(false);

        uploader.cancelUpload();
      });

      it("does not abort any XHRs", function() {
        expect(mockAjax1.abort).not.toHaveBeenCalled();
        expect(mockAjax2.abort).not.toHaveBeenCalled();
        expect(mockAjax3.abort).not.toHaveBeenCalled();
      });
    });

    describe("when the uploader is uploading", function() {
      beforeEach(function() {
        spyOn(uploader, '_isUploading').and.returnValue(true);
        spyOn(uploader, '_notifyUploadCancelled');
        spyOn(uploader, '_setCancelled');
        spyOn(uploader, '_resetData');

        uploader.cancelUpload();
      });

      it("aborts any XHRs", function() {
        expect(mockAjax1.abort).toHaveBeenCalled();
        expect(mockAjax2.abort).toHaveBeenCalled();
        expect(mockAjax3.abort).toHaveBeenCalled();
      });

      it("notifies that the upload has been cancelled", function() {
        expect(uploader._notifyUploadCancelled).toHaveBeenCalled();
      });

      it("sets the uploader to a cancelled state", function() {
        expect(uploader._setCancelled).toHaveBeenCalled();
      });

      it("resets the uploader's data", function() {
        expect(uploader._resetData).toHaveBeenCalled();
      });

    });

  });

  describe("_createChunks", function() {
    var uploader, mockFile, fileSize, mockSettings, tenMB;

    describe("when the file can be split into even chunks", function() {
      var chunk1, chunk2, chunk3, chunk4, chunk5;

      beforeEach(function() {
        tenMB = 1024 * 1024 * 10;
        fileSize = tenMB * 5; // 50 megabyte file;
        mockFile = { name: "myfile", type: "video/quicktime", size: fileSize };
        mockSettings = { maxChunkSize: tenMB };

        uploader = new BasicS3Uploader(mockFile, mockSettings);
        uploader._createChunks();

        chunk1 = uploader._chunks[1];
        chunk2 = uploader._chunks[2];
        chunk3 = uploader._chunks[3];
        chunk4 = uploader._chunks[4];
        chunk5 = uploader._chunks[5];
      });

      it("slices up the file into chunks", function() {
        expect(Object.keys(uploader._chunks).length).toEqual(5);
      });

      it("correctly calculates the chunk's startRange and endRage", function() {
        expect(chunk1.startRange).toEqual(0);
        expect(chunk1.endRange).toEqual(tenMB);

        expect(chunk2.startRange).toEqual(chunk1.endRange);
        expect(chunk2.endRange).toEqual(tenMB + chunk1.endRange);

        expect(chunk3.startRange).toEqual(chunk2.endRange);
        expect(chunk3.endRange).toEqual(tenMB + chunk2.endRange);

        expect(chunk4.startRange).toEqual(chunk3.endRange);
        expect(chunk4.endRange).toEqual(tenMB + chunk3.endRange);

        expect(chunk5.startRange).toEqual(chunk4.endRange);
        expect(chunk5.endRange).toEqual(tenMB + chunk4.endRange);
      });

      it("sets the 'uploading' and 'uploadCoplete' flags on each chunk to false", function() {
        expect(chunk1.uploading).toBeFalsy();
        expect(chunk1.uploadComplete).toBeFalsy();

        expect(chunk2.uploading).toBeFalsy();
        expect(chunk2.uploadComplete).toBeFalsy();

        expect(chunk3.uploading).toBeFalsy();
        expect(chunk3.uploadComplete).toBeFalsy();

        expect(chunk4.uploading).toBeFalsy();
        expect(chunk4.uploadComplete).toBeFalsy();

        expect(chunk5.uploading).toBeFalsy();
        expect(chunk5.uploadComplete).toBeFalsy();
      });
    });

    describe("when the file size is not evenly divisible by the chunk size", function() {
      describe("and the file size is smaller than the chunk size", function() {
        var chunk1;

        beforeEach(function() {
          tenMB = 1024 * 1024 * 10;
          fileSize = (tenMB / 2);
          mockFile = { name: "myfile", type: "video/quicktime", size: fileSize };
          mockSettings = { maxChunkSize: tenMB };

          uploader = new BasicS3Uploader(mockFile, mockSettings);
          uploader._createChunks();

          chunk1 = uploader._chunks[1];
        });

        it("slices up the file into chunks", function() {
          expect(Object.keys(uploader._chunks).length).toEqual(1);
        });

        it("correctly calculates the chunk's startRange and endRage", function() {
          expect(chunk1.startRange).toEqual(0);
          expect(chunk1.endRange).toEqual(fileSize);
        });

        it("sets the 'uploading' and 'uploadCoplete' flags on each chunk to false", function() {
          expect(chunk1.uploading).toBeFalsy();
          expect(chunk1.uploadComplete).toBeFalsy();
        });
      });

      describe("and there are remaining bytes leftover", function() {
        var chunk1, chunk2, chunk3, chunk4, chunk5;

        beforeEach(function() {
          tenMB = 1024 * 1024 * 10;
          fileSize = tenMB * 5.5; // 65 megabyte file;
          mockFile = { name: "myfile", type: "video/quicktime", size: fileSize };
          mockSettings = { maxChunkSize: tenMB };

          uploader = new BasicS3Uploader(mockFile, mockSettings);
          uploader._createChunks();

          chunk1 = uploader._chunks[1];
          chunk2 = uploader._chunks[2];
          chunk3 = uploader._chunks[3];
          chunk4 = uploader._chunks[4];
          chunk5 = uploader._chunks[5];
          chunk6 = uploader._chunks[6];
        });

        it("slices up the file into chunks", function() {
          expect(Object.keys(uploader._chunks).length).toEqual(6);
        });

        it("correctly calculates the chunk's startRange and endRage", function() {
          expect(chunk1.startRange).toEqual(0);
          expect(chunk1.endRange).toEqual(tenMB);

          expect(chunk2.startRange).toEqual(chunk1.endRange);
          expect(chunk2.endRange).toEqual(tenMB + chunk1.endRange);

          expect(chunk3.startRange).toEqual(chunk2.endRange);
          expect(chunk3.endRange).toEqual(tenMB + chunk2.endRange);

          expect(chunk4.startRange).toEqual(chunk3.endRange);
          expect(chunk4.endRange).toEqual(tenMB + chunk3.endRange);

          expect(chunk5.startRange).toEqual(chunk4.endRange);
          expect(chunk5.endRange).toEqual(tenMB + chunk4.endRange);

          expect(chunk6.startRange).toEqual(chunk5.endRange);
          // 5 megabytes are left for this chunk
          expect(chunk6.endRange).toEqual((tenMB / 2) + chunk5.endRange);
        });

        it("sets the 'uploading' and 'uploadCoplete' flags on each chunk to false", function() {
          expect(chunk1.uploading).toBeFalsy();
          expect(chunk1.uploadComplete).toBeFalsy();

          expect(chunk2.uploading).toBeFalsy();
          expect(chunk2.uploadComplete).toBeFalsy();

          expect(chunk3.uploading).toBeFalsy();
          expect(chunk3.uploadComplete).toBeFalsy();

          expect(chunk4.uploading).toBeFalsy();
          expect(chunk4.uploadComplete).toBeFalsy();

          expect(chunk5.uploading).toBeFalsy();
          expect(chunk5.uploadComplete).toBeFalsy();

          expect(chunk6.uploading).toBeFalsy();
          expect(chunk6.uploadComplete).toBeFalsy();
        });
      });
    });

  });

  describe("_getInitSignature", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        signatureBackend: "/signatures",
        initSignaturePath: "/get_init_signature",
        key: "my-upload-key",
        contentType: "video/quicktime",
        bucket: "some-bucket",
        acl: "private",
        encrypted: false,
        customHeaders: { "X-Derp": "Yes" },
        maxRetries: 3
      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("performs an ajax call to the provided init signature path", function() {
      spyOn(uploader, '_ajax');
      uploader._getInitSignature();
      expect(uploader._ajax).toHaveBeenCalled();

      ajaxSettings = uploader._ajax.calls.argsFor(0)[0];
      expect(ajaxSettings.url).toEqual(mockSettings.signatureBackend + mockSettings.initSignaturePath);
      expect(ajaxSettings.method).toEqual("GET");
      expect(ajaxSettings.customHeaders).toEqual(mockSettings.customHeaders);
      expect(ajaxSettings.params.key).toEqual(mockSettings.key);
      expect(ajaxSettings.params.filename).toEqual(mockFile.name);
      expect(ajaxSettings.params.filesize).toEqual(mockFile.size);
      expect(ajaxSettings.params.mime_type).toEqual(mockSettings.contentType);
      expect(ajaxSettings.params.bucket).toEqual(mockSettings.bucket);
      expect(ajaxSettings.params.acl).toEqual(mockSettings.acl);
      expect(ajaxSettings.params.encrypted).toEqual(mockSettings.encrypted);
    });

    it("pushes the xhr request into the _XHRs array", function() {
      spyOn(uploader, '_ajax').and.returnValue("XHR");
      expect(uploader._XHRs.length).toEqual(0);
      uploader._getInitSignature();
      expect(uploader._XHRs[0]).toEqual("XHR");
    });

    describe("a successful response", function() {
      var mockResponse;

      beforeEach(function() {
        mockResponse = {
          target: { responseText: "{\"signature\": \"init-signature\", \"date\": \"init-date\"}" }
        };

        spyOn(uploader, '_ajax').and.callFake(function(ajaxSettings) {
          ajaxSettings.status = 200;
          ajaxSettings.success(mockResponse);
        });

        spyOn(uploader, '_initiateUpload');

        uploader._getInitSignature();
      });

      it("stores the returned init signature and date on the uploader", function() {
        expect(uploader._initSignature).toEqual("init-signature");
        expect(uploader._date).toEqual("init-date");
      });

      it("continues to initiate the upload request", function() {
        expect(uploader._initiateUpload).toHaveBeenCalled();
      });

    });

    describe("a failed response", function() {

      beforeEach(function() {
        spyOn(uploader, '_ajax').and.callFake(function(ajaxSettings) {
          ajaxSettings.status = 400;
          ajaxSettings.error(null);
        });

      });

      describe("when there are retries available", function() {
        beforeEach(function() {
          spyOn(window, 'setTimeout').and.callFake(function(callback, interval) {
            callback();
          });

          spyOn(uploader, '_notifyUploadRetry');
          spyOn(uploader, '_getInitSignature').and.callThrough();

          uploader._getInitSignature();
        });

        it("notifies about the next retry attempt", function() {
          expect(uploader._notifyUploadRetry.calls.count()).toEqual(mockSettings.maxRetries);
        });

        it("retries the call, up to the maxRetries setting", function() {
          // 3 retries and 1 inital call
          expect(uploader._getInitSignature.calls.count()).toEqual(mockSettings.maxRetries + 1);
        });

      });

      describe("when no retries are available", function() {
        beforeEach(function() {
          spyOn(uploader, '_retryAvailable').and.returnValue(false);
          spyOn(uploader, '_notifyUploadError');
          spyOn(uploader, '_setFailed');
          spyOn(uploader, '_resetData');
          uploader._getInitSignature();
        });

        it("notifies that the upload has failed", function() {
          expect(uploader._notifyUploadError).toHaveBeenCalledWith(2, uploader.errors[2]);
        });

        it("sets the uploader to a failed state", function() {
          expect(uploader._setFailed).toHaveBeenCalled();
        });

        it("resets the uploader's data", function() {
          expect(uploader._resetData).toHaveBeenCalled();
        });
      });
    });
  });

  describe("_initiateUpload", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        host: 'some-host',
        key: "my-upload-key",
        acl: "private",
        encrypted: false,
        maxRetries: 3,
        awsAccessKey: 'my-access-key',

      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("adds the XHR object to the _XHRs array", function() {
      spyOn(uploader, '_ajax').and.returnValue("XHR");
      expect(uploader._XHRs.length).toEqual(0);
      uploader._initiateUpload();
      expect(uploader._XHRs[0]).toEqual("XHR");
    });

    describe("ajax settings", function() {
      var ajaxSettings;

      beforeEach(function() {
        spyOn(uploader, '_ajax');
        uploader._date = "today";
        uploader._initSignature = "init-signature";
      });

      it("properly configures the url, method, and headers for the call", function() {
        uploader._initiateUpload();
        ajaxSettings = uploader._ajax.calls.argsFor(0)[0];

        expect(ajaxSettings.url).toEqual("some-host/my-upload-key?uploads");
        expect(ajaxSettings.method).toEqual("POST");
        expect(ajaxSettings.headers['x-amz-date']).toEqual('today');
        expect(ajaxSettings.headers['x-amz-acl']).toEqual('private');
        expect(ajaxSettings.headers['Authorization']).toEqual('AWS my-access-key:init-signature');
        expect(ajaxSettings.headers['Content-Disposition']).toEqual('attachment; filename=myfile');
      });

      describe("non-encrypted upload", function() {
        it("does not set the encryption header", function() {
          uploader.settings.encrypted = false;
          uploader._initiateUpload();
          ajaxSettings = uploader._ajax.calls.argsFor(0)[0];
          expect(ajaxSettings.headers['x-amz-server-side-encryption']).toBeUndefined();
        });
      });

      describe("an encrypted upload", function() {
        it("sets the encryption header", function() {
          uploader.settings.encrypted = true;
          uploader._initiateUpload();
          ajaxSettings = uploader._ajax.calls.argsFor(0)[0];
          expect(ajaxSettings.headers['x-amz-server-side-encryption']).toEqual("AES256");
        });
      });

    });

    describe("a successful response", function() {
      var mockResponse, xml;

      beforeEach(function() {
        xml = new DOMParser().parseFromString("<SomeResponse><UploadId>the-upload-id</UploadId></SomeResponse>","text/xml");
        mockResponse = {
          target: {
            responseXML: xml
          }
        };
        spyOn(uploader, '_ajax').and.callFake(function(config) {
          config.status = 200;
          config.success(mockResponse);
        });
        spyOn(uploader, '_getRemainingSignatures').and.callFake(function(retries, callback) {
          callback();
        });
        spyOn(uploader, '_uploadChunks');
        uploader._initiateUpload();
      });

      it("stores the uploadId from the response xml", function() {
        expect(uploader._uploadId).toEqual('the-upload-id');
      });

      it("fetches the remaining signatures", function() {
        expect(uploader._getRemainingSignatures).toHaveBeenCalled();
      });

      it("begins uploading chunks once the remaining signatures are present", function() {
        expect(uploader._uploadChunks).toHaveBeenCalled();
      });

    });

    describe("a failed response", function() {
      var mockResponse;

      beforeEach(function() {
        mockResponse = {};
        spyOn(uploader, '_ajax').and.callFake(function(config) {
          config.status = 400;
          config.error(null);
        });
      });

      describe("and retries are available", function() {
        beforeEach(function() {
          spyOn(window, 'setTimeout').and.callFake(function(callback, interval) {
            callback();
          });

          spyOn(uploader, '_notifyUploadRetry');
          spyOn(uploader, '_initiateUpload').and.callThrough();

          uploader._initiateUpload();
        });

        it("notifies about the next retry attempt", function() {
          expect(uploader._notifyUploadRetry.calls.count()).toEqual(mockSettings.maxRetries);
        });

        it("retries the call, up to the maxRetries setting", function() {
          // 3 retries and 1 inital call
          expect(uploader._initiateUpload.calls.count()).toEqual(mockSettings.maxRetries + 1);
        });
      });

      describe("and no retries are available", function() {
        beforeEach(function() {
          spyOn(uploader, '_retryAvailable').and.returnValue(false);
          spyOn(uploader, '_notifyUploadError');
          spyOn(uploader, '_setFailed');
          spyOn(uploader, '_resetData');
          uploader._initiateUpload();
        });

        it("notifies that the upload has failed", function() {
          expect(uploader._notifyUploadError).toHaveBeenCalledWith(3, uploader.errors[3]);
        });

        it("sets the uploader to a failed state", function() {
          expect(uploader._setFailed).toHaveBeenCalled();
        });

        it("resets the uploader's data", function() {
          expect(uploader._resetData).toHaveBeenCalled();
        });
      });

    });
  });

  describe("_getRemainingSignatures", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        host: 'some-host',
        key: "my-upload-key",
        acl: "private",
        encrypted: false,
        maxRetries: 3,
        awsAccessKey: 'my-access-key',
        customHeaders: { "X-Custom-Header": "Stuff" },
        contentType: "video/quicktime",
        bucket: "my-bucket",
        signatureBackend: "/signatures",
        remainingSignaturesPath: "/remaining"

      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._uploadId = "upload-id";
      uploader._chunks = {
        1: "blah",
        2: "blah",
        3: "blah"
      };
    });

    it("adds the XHR object to the _XHRs array", function() {
      spyOn(uploader, '_ajax').and.returnValue("XHR");
      expect(uploader._XHRs.length).toEqual(0);
      uploader._getRemainingSignatures();
      expect(uploader._XHRs[0]).toEqual("XHR");
    });

    describe("ajax settings", function() {
      var ajaxSettings;

      beforeEach(function() {
        spyOn(uploader, '_ajax');
      });

      it("properly configures the url, method, params, and headers for the call", function() {
        uploader._getRemainingSignatures();
        ajaxSettings = uploader._ajax.calls.argsFor(0)[0];

        expect(ajaxSettings.url).toEqual("/signatures/remaining");
        expect(ajaxSettings.method).toEqual("GET");
        expect(ajaxSettings.params.upload_id).toEqual("upload-id");
        expect(ajaxSettings.params.total_chunks).toEqual(3);
        expect(ajaxSettings.params.mime_type).toEqual("video/quicktime");
        expect(ajaxSettings.params.bucket).toEqual("my-bucket");
        expect(ajaxSettings.params.key).toEqual("my-upload-key");
        expect(ajaxSettings.customHeaders['X-Custom-Header']).toEqual("Stuff");
      });

    });

    describe("a successful response", function() {
      var mockResponse, json, callback;

      beforeEach(function() {
        json = '{"chunk_signatures":{"1":{"signature":"signature","date":"date"},"2":{"signature":"signature","date":"date"},"3":{"signature":"signature","date":"date"}},"complete_signature":{"signature":"signature","date":"date"},"list_signature":{"signature":"signature","date":"date"}}';
        mockResponse = {
          target: {
            responseText: json
          }
        };
        spyOn(uploader, '_ajax').and.callFake(function(config) {
          config.status = 200;
          config.success(mockResponse);
        });
        callback = jasmine.createSpy();
        uploader._getRemainingSignatures(0, callback);
      });

      it("stores the returned signatures", function() {
        expect(uploader._chunkSignatures[1].signature).toEqual("signature");
        expect(uploader._chunkSignatures[1].date).toEqual("date");
        expect(uploader._chunkSignatures[2].signature).toEqual("signature");
        expect(uploader._chunkSignatures[2].date).toEqual("date");
        expect(uploader._chunkSignatures[3].signature).toEqual("signature");
        expect(uploader._chunkSignatures[3].date).toEqual("date");
      });

      it("executes the provided callback, if defined", function() {
        expect(callback).toHaveBeenCalled();
      });

    });

    describe("a failed response", function() {
      var mockResponse;

      beforeEach(function() {
        mockResponse = {};
        spyOn(uploader, '_ajax').and.callFake(function(config) {
          config.status = 400;
          config.error(null);
        });
      });

      describe("and retries are available", function() {
        beforeEach(function() {
          spyOn(window, 'setTimeout').and.callFake(function(callback, interval) {
            callback();
          });

          spyOn(uploader, '_notifyUploadRetry');
          spyOn(uploader, '_getRemainingSignatures').and.callThrough();

          uploader._getRemainingSignatures(0);
        });

        it("notifies about the next retry attempt", function() {
          expect(uploader._notifyUploadRetry.calls.count()).toEqual(mockSettings.maxRetries);
        });

        it("retries the call, up to the maxRetries setting", function() {
          // 3 retries and 1 inital call
          expect(uploader._getRemainingSignatures.calls.count()).toEqual(mockSettings.maxRetries + 1);
        });
      });

      describe("and no retries are available", function() {
        beforeEach(function() {
          spyOn(uploader, '_retryAvailable').and.returnValue(false);
          spyOn(uploader, '_notifyUploadError');
          spyOn(uploader, '_setFailed');
          spyOn(uploader, '_resetData');
          uploader._getRemainingSignatures(0);
        });

        it("notifies that the upload has failed", function() {
          expect(uploader._notifyUploadError).toHaveBeenCalledWith(4, uploader.errors[4]);
        });

        it("sets the uploader to a failed state", function() {
          expect(uploader._setFailed).toHaveBeenCalled();
        });

        it("resets the uploader's data", function() {
          expect(uploader._resetData).toHaveBeenCalled();
        });
      });

    });
  });

  describe("_uploadChunks", function() {
    var mockFile, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      uploader = new BasicS3Uploader(mockFile, {});
      uploader._chunks = {
        1: { uploading: false, uploadComplete: false },
        2: { uploading: true, uploadComplete: false },
        3: { uploading: false, uploadComplete: true },
        4: { uploading: false, uploadComplete: false },
      };
      spyOn(uploader, '_uploadChunk');
    });

    describe("when there is an upload spot available", function() {
      beforeEach(function() {
        spyOn(uploader, '_uploadSpotAvailable').and.returnValue(true);
        uploader._uploadChunks();
      });

      it("uploads a chunk if its not already uploading and not already complete", function() {
        expect(uploader._uploadChunk.calls.count()).toEqual(2);
        expect(uploader._uploadChunk.calls.argsFor(0)[0]).toEqual(1);
        expect(uploader._uploadChunk.calls.argsFor(1)[0]).toEqual(4);
      });
    });

    describe("when there is not an upload spot available", function() {
      beforeEach(function() {
        spyOn(uploader, '_uploadSpotAvailable').and.returnValue(false);
        uploader._uploadChunks();
      });

      it("won't upload any chunks", function() {
        expect(uploader._uploadChunk.calls.count()).toEqual(0);
      });
    });

  });

  describe("_uploadSpotAvailable", function() {
    var mockFile, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      uploader = new BasicS3Uploader(mockFile, {});
      uploader.settings.maxConcurrentChunks = 3;
    });

    it("returns true if the number of concurrent uploads is less than the max amount", function() {
      uploader._chunkUploadsInProgress = 2;
      expect(uploader._uploadSpotAvailable()).toBeTruthy();
    });

    it("returns false if the number of concurrent uploads is equal to the max amount", function() {
      uploader._chunkUploadsInProgress = 3;
      expect(uploader._uploadSpotAvailable()).toBeFalsy();
    });
  });

  describe("_uploadChunk", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000, slice: function(start, end) { return "file-blob"; } };
      mockSettings = {
        host: 'some-host',
        key: "my-upload-key",
        acl: "private",
        encrypted: false,
        maxRetries: 3,
        awsAccessKey: 'my-access-key',
        customHeaders: { "X-Custom-Header": "Stuff" },
        contentType: "video/quicktime",
        bucket: "my-bucket",
        signatureBackend: "/signatures",
        remainingSignaturesPath: "/remaining"

      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._uploadId = "upload-id";
      uploader._chunks = {
        1: { startRange: 0, endRange: 1000, uploading: false, uploadComplete: false }
      };
      uploader._chunkSignatures = {
        1: { signature: 'chunk-signature', date: 'date' }
      };
    });

    it("adds the XHR object to the _chunkXHRs map", function() {
      spyOn(uploader, '_ajax').and.returnValue("XHR");
      expect(Object.keys(uploader._chunkXHRs).length).toEqual(0);
      uploader._uploadChunk(1);
      expect(uploader._chunkXHRs[1]).toEqual("XHR");
    });

    describe("ajax settings", function() {
      var ajaxSettings;

      beforeEach(function() {
        spyOn(uploader, '_ajax');
      });

      it("properly configures the url, method, params, and headers for the call", function() {
        uploader._uploadChunk(1);
        ajaxSettings = uploader._ajax.calls.argsFor(0)[0];
        expect(ajaxSettings.url).toEqual('some-host/my-upload-key');
        expect(ajaxSettings.method).toEqual('PUT');
        expect(ajaxSettings.body).toEqual('file-blob');
        expect(ajaxSettings.params.uploadId).toEqual('upload-id');
        expect(ajaxSettings.params.partNumber).toEqual(1);
        expect(ajaxSettings.headers['x-amz-date']).toEqual('date');
        expect(ajaxSettings.headers['Authorization']).toEqual('AWS my-access-key:chunk-signature');
        expect(ajaxSettings.headers['Content-Disposition']).toEqual('attachment; filename=myfile');
        expect(ajaxSettings.headers['Content-Type']).toEqual('video/quicktime');
      });

    });

    describe("a successful response", function() {
      var mocks;

      beforeEach(function() {
        mocks = {
          getResponseHeader: function(header) {}
        };
        mockResponse = "";
        spyOn(uploader, '_ajax').and.callFake(function(config) {
          config.status = 200;
          config.getResponseHeader = mocks.getResponseHeader;
          config.success(null);
        });
        spyOn(uploader, '_notifyChunkUploaded');
        spyOn(mocks, 'getResponseHeader').and.returnValue('eTag');

      });

      describe("handles the chunk status and stores data about the upload", function() {
        beforeEach(function() {
          spyOn(uploader, '_allETagsAvailable').and.returnValue(false);
          spyOn(uploader, '_uploadChunks');
          uploader._uploadChunk(1);
        });

        it("flags the chunk as no longer uploading and that the upload is complete", function() {
          expect(uploader._chunks[1].uploading).toBeFalsy();
          expect(uploader._chunks[1].uploadComplete).toBeTruthy();
        });

        it("deletes the chunk XHR object", function() {
          expect(uploader._chunkXHRs[1]).toBeUndefined();
        });

        it("decrements _chunkUploadsInProgress by 1", function() {
          expect(uploader._chunkUploadsInProgress).toEqual(0);
        });

        it("notifies that the chunk has uploaded", function() {
          var totalChunks = Object.keys(uploader._chunks).length;
          expect(uploader._notifyChunkUploaded).toHaveBeenCalledWith(1, totalChunks);
        });

        it("gets the eTag from the responseHeaders and stores it", function() {
          expect(mocks.getResponseHeader).toHaveBeenCalledWith("ETag");
          expect(uploader._eTags[1]).toEqual("eTag");
        });
      });

      describe("when all eTags are available", function() {
        beforeEach(function() {
          spyOn(uploader, '_allETagsAvailable').and.returnValue(true);
          spyOn(uploader, '_verifyAllChunksUploaded');
          uploader._uploadChunk(1);
        });

        it("calls to verify if all chunks have been uploaded", function() {
          expect(uploader._verifyAllChunksUploaded).toHaveBeenCalled();
        });
      });

      describe("when not all eTags are avaialble", function() {
        beforeEach(function() {
          spyOn(uploader, '_allETagsAvailable').and.returnValue(false);
          spyOn(uploader, '_uploadChunks');
          uploader._uploadChunk(1);
        });

        it("continues uploading the remaining chunks", function() {
          expect(uploader._uploadChunks).toHaveBeenCalled();
        });
      });

    });

    describe("a failed response", function() {
      var xhrAbortSpy;

      beforeEach(function() {
        xhrAbortSpy = jasmine.createSpy();
        uploader._chunkXHRs[1] = { abort: xhrAbortSpy };
        spyOn(uploader, '_ajax').and.callFake(function(config) {
          config.status = 400;
          config.error(null);
        });
        spyOn(window, 'setTimeout').and.callFake(function(callback, interval) {
          callback();
        });
        spyOn(uploader, '_notifyUploadRetry');
        spyOn(uploader, '_retryChunk');
        uploader._uploadChunk(1);
      });

      it("decrements the _chunkUploadsInProgress by one", function() {
        expect(uploader._chunkUploadsInProgress).toEqual(0);
      });

      it("sets uploading and uploadComplete to false for the chunk", function() {
        expect(uploader._chunks[1].uploading).toBeFalsy();
        expect(uploader._chunks[1].uploadComplete).toBeFalsy();
      });

      it("aborts the XHR for that chunk", function() {
        expect(xhrAbortSpy).toHaveBeenCalled();
      });

      it("deletes the XHR for that chunk", function() {
        expect(uploader._chunkXHRs[1]).toBeUndefined();
      });

      it("notfies that the chunk upload is going to retry another attempt", function() {
        expect(uploader._notifyUploadRetry).toHaveBeenCalled();
      });

      it("retries uploading the chunk", function() {
        expect(uploader._retryChunk).toHaveBeenCalledWith(1);
      });
    });
  });

  describe("_verifyAllChunksUploaded", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        host: 'some-host',
        key: "my-upload-key",
        acl: "private",
        encrypted: false,
        maxRetries: 3,
        awsAccessKey: 'my-access-key',
        customHeaders: { "X-Custom-Header": "Stuff" },
        contentType: "video/quicktime",
        bucket: "my-bucket",
        signatureBackend: "/signatures",
        remainingSignaturesPath: "/remaining"

      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._uploadId = "upload-id";
      uploader._chunks = {
        1: { startRange: 0, endRange: 1000, uploading: false, uploadComplete: false },
        2: { startRange: 1000, endRange: 2000, uploading: false, uploadComplete: false }
      };
      uploader._listSignature = { signature: 'list-signature', date: 'date' };
      uploader._eTags = {
        1: '"chunk-1-eTag"',
        2: '"chunk-2-eTag"',
      }
    });

    it("adds the XHR object to the _chunkXHRs map", function() {
      spyOn(uploader, '_ajax').and.returnValue("XHR");
      expect(uploader._XHRs.length).toEqual(0);
      uploader._verifyAllChunksUploaded();
      expect(uploader._XHRs[0]).toEqual("XHR");
    });

    describe("ajax settings", function() {
      var ajaxSettings;

      beforeEach(function() {
        spyOn(uploader, '_ajax');
      });

      it("properly configures the url, method, params, and headers for the call", function() {
        uploader._verifyAllChunksUploaded();
        ajaxSettings = uploader._ajax.calls.argsFor(0)[0];
        expect(ajaxSettings.url).toEqual('some-host/my-upload-key');
        expect(ajaxSettings.method).toEqual('GET');
        expect(ajaxSettings.params.uploadId).toEqual('upload-id');
        expect(ajaxSettings.headers['x-amz-date']).toEqual('date');
        expect(ajaxSettings.headers['Authorization']).toEqual('AWS my-access-key:list-signature');
      });

    });

    describe("a successful response", function() {
      describe('when the total parts uploaded does not equal the number of parts sent', function() {
        var mockResponse, xml, xmlString;

        // One part is missing from the response
        xmlString = "<Parts>";
        xmlString += "<Part><PartNumber>1</PartNumber><ETag>\"chunk-1-eTag\"</ETag><Size>1000</Size></Part>";
        xmlString += "</Parts>";
        xml = new DOMParser().parseFromString(xmlString, "text/xml");

        beforeEach(function() {
          mockResponse = {
            target: {
              responseXML: xml
            }
          };
          spyOn(uploader, '_ajax').and.callFake(function(config) {
            config.status = 200;
            config.success(mockResponse);
          });
          spyOn(uploader, '_handleMissingChunks');
          uploader._verifyAllChunksUploaded();
        });

        it("calls _handleMissingChunks with the list of parts returned from Amazon", function() {
          var parts = xml.getElementsByTagName("Part");
          expect(uploader._handleMissingChunks).toHaveBeenCalledWith(parts);
        });

      });

      describe('when there are invalid parts', function() {
        var mockResponse, xml, xmlString;

        // Part 1 has an invalid eTag, Part 2 has an invalid size
        xmlString = "<Parts>";
        xmlString += "<Part><PartNumber>1</PartNumber><ETag>\"invalid-eTag\"</ETag><Size>1000</Size></Part>";
        xmlString += "<Part><PartNumber>2</PartNumber><ETag>\"chunk-2-eTag\"</ETag><Size>0</Size></Part>";
        xmlString += "</Parts>";
        xml = new DOMParser().parseFromString(xmlString, "text/xml");

        beforeEach(function() {
          mockResponse = {
            target: {
              responseXML: xml
            }
          };
          spyOn(uploader, '_ajax').and.callFake(function(config) {
            config.status = 200;
            config.success(mockResponse);
          });
          spyOn(uploader, '_handleInvalidChunks');
          uploader._verifyAllChunksUploaded();
        });

        it("calls _handleInvalidChunks with the list of part numbers that are invalid", function() {
          var invalidChunks = [1, 2];
          expect(uploader._handleInvalidChunks).toHaveBeenCalledWith(invalidChunks);
        });

      });

      describe('when all parts have been uploaded and are valid', function() {
        var mockResponse, xml, xmlString;

        // All Parts are uploaded and valid
        xmlString = "<Parts>";
        xmlString += "<Part><PartNumber>1</PartNumber><ETag>\"chunk-1-eTag\"</ETag><Size>1000</Size></Part>";
        xmlString += "<Part><PartNumber>2</PartNumber><ETag>\"chunk-2-eTag\"</ETag><Size>1000</Size></Part>";
        xmlString += "</Parts>";
        xml = new DOMParser().parseFromString(xmlString, "text/xml");

        beforeEach(function() {
          mockResponse = {
            target: {
              responseXML: xml
            }
          };
          spyOn(uploader, '_ajax').and.callFake(function(config) {
            config.status = 200;
            config.success(mockResponse);
          });
          spyOn(uploader, '_completeUpload');
          uploader._verifyAllChunksUploaded();
        });

        it("calls _completeUpload", function() {
          expect(uploader._completeUpload).toHaveBeenCalled();
        });
      });

    });

    describe("a failed response", function() {

      beforeEach(function() {
        spyOn(uploader, '_ajax').and.callFake(function(config) {
          config.status = 400;
          config.error(null);
        });
        spyOn(window, 'setTimeout').and.callFake(function(callback, interval) {
          callback();
        });
      });

      describe("and retries are available", function() {
        beforeEach(function() {
          spyOn(uploader, '_notifyUploadRetry');
          spyOn(uploader, '_getRemainingSignatures').and.callFake(function(attempt, callback) {
            callback();
          });
          spyOn(uploader, '_verifyAllChunksUploaded').and.callThrough();

          uploader._verifyAllChunksUploaded();
        });

        it("notifies about the next retry attempt", function() {
          expect(uploader._notifyUploadRetry.calls.count()).toEqual(mockSettings.maxRetries);
        });

        it("refreshes upload signatures", function() {
          expect(uploader._getRemainingSignatures).toHaveBeenCalled();
        });

        it("retries the call, up to the maxRetries setting", function() {
          // 3 retries and 1 inital call
          expect(uploader._verifyAllChunksUploaded.calls.count()).toEqual(mockSettings.maxRetries + 1);
        });
      });

      describe("and no retries are available", function() {
        beforeEach(function() {
          spyOn(uploader, '_retryAvailable').and.returnValue(false);
          spyOn(uploader, '_notifyUploadError');
          spyOn(uploader, '_setFailed');
          spyOn(uploader, '_resetData');
          uploader._verifyAllChunksUploaded();
        });

        it("notifies that the upload has failed", function() {
          expect(uploader._notifyUploadError).toHaveBeenCalledWith(6, uploader.errors[6]);
        });

        it("sets the uploader to a failed state", function() {
          expect(uploader._setFailed).toHaveBeenCalled();
        });

        it("resets the uploader's data", function() {
          expect(uploader._resetData).toHaveBeenCalled();
        });
      });

    });
  });

  describe("_handleInvalidChunks", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      spyOn(uploader, '_retryChunk');

      uploader._handleInvalidChunks([1, 3, 5]);
    });

    it('calls _retryChunk for each invalid chunk number given', function() {
      expect(uploader._retryChunk.calls.count()).toEqual(3);
      expect(uploader._retryChunk.calls.argsFor(0)[0]).toEqual(1);
      expect(uploader._retryChunk.calls.argsFor(1)[0]).toEqual(3);
      expect(uploader._retryChunk.calls.argsFor(2)[0]).toEqual(5);
    });
  });

  describe("_handleMissingChunks", function() {
    var mockFile, mockSettings, uploader, xml, xmlString;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      spyOn(uploader, '_retryChunk');

      // The uploader has kept track of 4 chunks
      uploader._chunks = {
        1: { startRange: 0, endRange: 1000, uploading: false, uploadComplete: true },
        2: { startRange: 1000, endRange: 2000, uploading: false, uploadComplete: true },
        3: { startRange: 2000, endRange: 3000, uploading: false, uploadComplete: true },
        4: { startRange: 3000, endRange: 4000, uploading: false, uploadComplete: true }
      };

      // But Amazon reported only getting 2 of them
      xmlString = "<Parts>";
      xmlString += "<Part><PartNumber>1</PartNumber><ETag>\"chunk-1-eTag\"</ETag><Size>1000</Size></Part>";
      xmlString += "<Part><PartNumber>3</PartNumber><ETag>\"chunk-3-eTag\"</ETag><Size>1000</Size></Part>";
      xmlString += "</Parts>";
      xml = new DOMParser().parseFromString(xmlString, "text/xml");

      var responseParts = xml.getElementsByTagName("Part");

      uploader._handleMissingChunks(responseParts);
    });

    it("calls _retryChunk for each chunk that was not listed in Amazon's response", function() {
      expect(uploader._retryChunk.calls.count()).toEqual(2);
      expect(uploader._retryChunk.calls.argsFor(0)[0]).toEqual('2');
      expect(uploader._retryChunk.calls.argsFor(1)[0]).toEqual('4');
    });
  });

  describe("_retryChunk", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._chunks = {
        1: { startRange: 0, endRange: 1000, uploading: false, uploadComplete: true },
      };
    });

    describe('when there are retries available', function() {
      beforeEach(function() {
        spyOn(uploader, '_retryAvailable').and.returnValue(true);
        spyOn(uploader, '_getRemainingSignatures').and.callFake(function(attempt, callback) {
          callback();
        });
        spyOn(uploader, '_uploadChunk');

        uploader._retryChunk(1);
      });

      it("fetches new upload signatures", function() {
        expect(uploader._getRemainingSignatures).toHaveBeenCalled();
      });

      it("uploads the chunk", function() {
        expect(uploader._uploadChunk).toHaveBeenCalledWith(1, 1);
      });
    });

    describe('when there are no retries available', function() {
      beforeEach(function() {
        spyOn(uploader, '_retryAvailable').and.returnValue(false);
        spyOn(uploader, '_notifyUploadError');
        spyOn(uploader, '_setFailed');
        spyOn(uploader, '_resetData');
        uploader._retryChunk(1);

      });

      it("notifies there was an upload error", function() {
        expect(uploader._notifyUploadError).toHaveBeenCalledWith(7, uploader.errors[7]);
      });

      it("sets the upload to a failed state", function() {
        expect(uploader._setFailed).toHaveBeenCalled();
      });

      it("resets the uploader's data", function() {
        expect(uploader._resetData).toHaveBeenCalled();
      });
    });
  });

  describe("_completeUpload", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        host: 'some-host',
        key: "my-upload-key",
        acl: "private",
        encrypted: false,
        maxRetries: 3,
        awsAccessKey: 'my-access-key',
        customHeaders: { "X-Custom-Header": "Stuff" },
        contentType: "video/quicktime",
        bucket: "my-bucket",
        signatureBackend: "/signatures",
        remainingSignaturesPath: "/remaining"

      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._uploadId = "upload-id";
      uploader._chunks = {
        1: { startRange: 0, endRange: 1000, uploading: false, uploadComplete: false },
        2: { startRange: 1000, endRange: 2000, uploading: false, uploadComplete: false }
      };
      uploader._completeSignature = { signature: 'complete-signature', date: 'date' };
      uploader._eTags = {
        1: '"chunk-1-eTag"',
        2: '"chunk-2-eTag"',
      }
      spyOn(uploader, '_requiresFirefoxHack').and.returnValue(false);
    });

    it("adds the XHR object to the _chunkXHRs map", function() {
      spyOn(uploader, '_ajax').and.returnValue("XHR");
      expect(uploader._XHRs.length).toEqual(0);
      uploader._completeUpload();
      expect(uploader._XHRs[0]).toEqual("XHR");
    });

    describe("ajax settings", function() {
      var ajaxSettings;

      beforeEach(function() {
        spyOn(uploader, '_ajax');
      });

      it("properly configures the url, method, params, and headers for the call", function() {
        uploader._completeUpload();
        var body;

        body = "<CompleteMultipartUpload>";
        body +=   "<Part>";
        body +=     "<PartNumber>1</PartNumber>";
        body +=     "<ETag>\"chunk-1-eTag\"</ETag>";
        body +=   "</Part>";
        body +=   "<Part>";
        body +=     "<PartNumber>2</PartNumber>";
        body +=     "<ETag>\"chunk-2-eTag\"</ETag>";
        body +=   "</Part>";
        body += "</CompleteMultipartUpload>";

        ajaxSettings = uploader._ajax.calls.argsFor(0)[0];
        expect(ajaxSettings.url).toEqual('some-host/my-upload-key');
        expect(ajaxSettings.method).toEqual('POST');
        expect(ajaxSettings.params.uploadId).toEqual('upload-id');
        expect(ajaxSettings.headers['x-amz-date']).toEqual('date');
        expect(ajaxSettings.headers['Authorization']).toEqual('AWS my-access-key:complete-signature');
        expect(ajaxSettings.headers['Content-Type']).toEqual('video/quicktime');
        expect(ajaxSettings.headers['Content-Disposition']).toEqual('attachment; filename=myfile');
        expect(ajaxSettings.body).toEqual(body);
      });

    });

    describe("a successful response", function() {
      var xml;
      beforeEach(function() {
        xml = new DOMParser().parseFromString("<SomeResponse><Location>the-upload-location</Location></SomeResponse>","text/xml");
        mockResponse = {
          target: {
            responseXML: xml
          }
        };
        spyOn(uploader, '_ajax').and.callFake(function(config) {
          config.status = 200;
          config.success(mockResponse);
        });
        spyOn(uploader, "_notifyUploadComplete");
        spyOn(uploader, "_setComplete");
        spyOn(uploader, "_resetData");
        uploader._completeUpload();
      });

      it("notifies that the upload is complete, passing in the location from the response xml", function() {
        expect(uploader._notifyUploadComplete).toHaveBeenCalledWith("the-upload-location");
      });

      it("sets the uploader to complete", function() {
        expect(uploader._setComplete).toHaveBeenCalled();
      });

      it("resets the uploader data", function() {
        expect(uploader._resetData).toHaveBeenCalled();
      });
    });

    describe("a failed response", function() {

      beforeEach(function() {
        spyOn(uploader, '_ajax').and.callFake(function(config) {
          config.status = 400;
          config.error(null);
        });
        spyOn(window, 'setTimeout').and.callFake(function(callback, interval) {
          callback();
        });
      });

      describe("and retries are available", function() {
        beforeEach(function() {
          spyOn(uploader, '_notifyUploadRetry');
          spyOn(uploader, '_getRemainingSignatures').and.callFake(function(attempt, callback) {
            callback();
          });
          spyOn(uploader, '_completeUpload').and.callThrough();

          uploader._completeUpload();
        });

        it("notifies about the next retry attempt", function() {
          expect(uploader._notifyUploadRetry.calls.count()).toEqual(mockSettings.maxRetries);
        });

        it("refreshes upload signatures", function() {
          expect(uploader._getRemainingSignatures).toHaveBeenCalled();
        });

        it("retries the call, up to the maxRetries setting", function() {
          // 3 retries and 1 inital call
          expect(uploader._completeUpload.calls.count()).toEqual(mockSettings.maxRetries + 1);
        });
      });

      describe("and no retries are available", function() {
        beforeEach(function() {
          spyOn(uploader, '_retryAvailable').and.returnValue(false);
          spyOn(uploader, '_notifyUploadError');
          spyOn(uploader, '_setFailed');
          spyOn(uploader, '_resetData');
          uploader._completeUpload();
        });

        it("notifies that the upload has failed", function() {
          expect(uploader._notifyUploadError).toHaveBeenCalledWith(8, uploader.errors[8]);
        });

        it("sets the uploader to a failed state", function() {
          expect(uploader._setFailed).toHaveBeenCalled();
        });

        it("resets the uploader's data", function() {
          expect(uploader._resetData).toHaveBeenCalled();
        });
      });

    });
  });

  describe("_retryAvailable", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        host: 'some-host',
        key: "my-upload-key",
        maxRetries: 3,
        awsAccessKey: 'my-access-key',
        bucket: "my-bucket"
      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("returns false when the uploader has been cancelled", function() {
      spyOn(uploader, '_isCancelled').and.returnValue(true);
      expect(uploader._retryAvailable(0)).toBeFalsy();
    });

    it("returns false when the uploader has failed", function() {
      spyOn(uploader, '_isFailed').and.returnValue(true);
      expect(uploader._retryAvailable(0)).toBeFalsy();
    });

    it("returns false when the retry number will exceed or equal the maxRetries setting", function() {
      expect(uploader._retryAvailable(3)).toBeFalsy();
    });

    it("returns false when the retry number will be less than the maxRetries setting", function() {
      expect(uploader._retryAvailable(2)).toBeTruthy();
    });
  });

  describe("_allETagsAvailable", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        host: 'some-host',
        key: "my-upload-key",
        maxRetries: 3,
        awsAccessKey: 'my-access-key',
        bucket: "my-bucket"
      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._chunks = {
        1: {},
        2: {}
      };
    });

    it('returns true if each chunk has an eTag', function() {
      uploader._eTags = {
        1: '"chunk-1-eTag"',
        2: '"chunk-2-eTag"',
      };
      expect(uploader._allETagsAvailable()).toBeTruthy();
    });

    it('returns false if at least 1 eTag is missing', function() {
      uploader._eTags = {
        1: '"chunk-1-eTag"'
      };
      expect(uploader._allETagsAvailable()).toBeFalsy();
    });
  });

  describe("_resetData", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        host: 'some-host',
        key: "my-upload-key",
        maxRetries: 3,
        awsAccessKey: 'my-access-key',
        bucket: "my-bucket"
      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._XHRs = ["someXHR"];
      uploader._date = "someDate";
      uploader._eTags = {1: "etag"};
      uploader._uploadId = "upload-id";
      uploader._initSignature = "init-sig";
      uploader._listSignature = "list-sig";
      uploader._completeSignature = "complete-sig";
      uploader._chunkSignatures = {1: "chunk-sig"};
      uploader._chunkXHRs = {1: "chunkXHR"};
      uploader._chunkProgress = {1: "chunkProgress"};
      uploader._chunkUploadsInProgress = 2;
    });

    it('clears out any attributes that are no longer needed ', function() {
      uploader._resetData();
      expect(uploader._XHRs).toEqual([]);
      expect(uploader._date).toBeNull();
      expect(uploader._eTags).toEqual({});
      expect(uploader._uploadId).toBeNull();
      expect(uploader._initSignature).toBeNull();
      expect(uploader._listSignature).toBeNull();
      expect(uploader._completeSignature).toBeNull();
      expect(uploader._chunkSignatures).toEqual({});
      expect(uploader._chunkXHRs).toEqual({});
      expect(uploader._chunkProgress).toEqual({});
      expect(uploader._chunkUploadsInProgress).toEqual(0);
    });
  });

  describe("_setReady", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._setReady();
    });

    it("sets the uploader status to 'ready'", function() {
      expect(uploader._status).toEqual('ready');
    });
  });

  describe("_isReady", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("returns true if the uploader status is 'ready'", function() {
      uploader._status = "something";
      expect(uploader._isReady()).toBeFalsy();
      uploader._status = "ready";
      expect(uploader._isReady()).toBeTruthy();
    });
  });

  describe("_setUploading", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._setUploading();
    });

    it("sets the uploader status to 'uploading'", function() {
      expect(uploader._status).toEqual('uploading');
    });
  });

  describe("_isUploading", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("returns true if the uploader status is 'uploading'", function() {
      uploader._status = "something";
      expect(uploader._isUploading()).toBeFalsy();
      uploader._status = "uploading";
      expect(uploader._isUploading()).toBeTruthy();
    });
  });

  describe("_setComplete", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._setComplete();
    });

    it("sets the uploader status to 'complete'", function() {
      expect(uploader._status).toEqual('complete');
    });
  });

  describe("_isComplete", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("returns true if the uploader status is 'uploading'", function() {
      uploader._status = "something";
      expect(uploader._isComplete()).toBeFalsy();
      uploader._status = "complete";
      expect(uploader._isComplete()).toBeTruthy();
    });
  });

  describe("_setCancelled", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._setCancelled();
    });

    it("sets the uploader status to 'cancelled'", function() {
      expect(uploader._status).toEqual('cancelled');
    });
  });

  describe("_isCancelled", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("returns true if the uploader status is 'cancelled'", function() {
      uploader._status = "something";
      expect(uploader._isCancelled()).toBeFalsy();
      uploader._status = "cancelled";
      expect(uploader._isCancelled()).toBeTruthy();
    });
  });

  describe("_setFailed", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._setFailed();
    });

    it("sets the uploader status to 'failed'", function() {
      expect(uploader._status).toEqual('failed');
    });
  });

  describe("_isFailed", function() {
    var mockFile, mockSettings, uploader;

    beforeEach(function() {
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {};
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("returns true if the uploader status is 'failed'", function() {
      uploader._status = "something";
      expect(uploader._isFailed()).toBeFalsy();
      uploader._status = "failed";
      expect(uploader._isFailed()).toBeTruthy();
    });
  });

  describe("_notifyUploaderReady", function() {
    var mockFile, mockSettings, uploader, spy;

    beforeEach(function() {
      spy = jasmine.createSpy();
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        onReady: spy
      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("calls the 'onReady' callback provided via upload settings", function() {
      uploader._notifyUploaderReady();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("_notifyUploadStarted", function() {
    var mockFile, mockSettings, uploader, spy;

    beforeEach(function() {
      spy = jasmine.createSpy();
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        onStart: spy
      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("calls the 'onStart' callback provided via upload settings", function() {
      uploader._notifyUploadStarted();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("_notifyUploadProgress", function() {
    var mockFile, mockSettings, uploader, spy;

    beforeEach(function() {
      spy = jasmine.createSpy();
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        onProgress: spy
      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._chunkProgress = {
        1: 500
      };

    });

    it("calls the 'onProgress' callback provided via upload settings, passing in bytes loaded and total bytes", function() {
      uploader._notifyUploadProgress();
      expect(spy).toHaveBeenCalledWith(500, 1000);
    });
  });

  describe("_notifyChunkUploaded", function() {
    var mockFile, mockSettings, uploader, spy;

    beforeEach(function() {
      spy = jasmine.createSpy();
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        onChunkUploaded: spy
      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("calls the 'onChunkUploaded' callback provided via upload settings, passing in the chunk number and total chunks", function() {
      uploader._notifyChunkUploaded(1, 3);
      expect(spy).toHaveBeenCalledWith(1, 3);
    });
  });

  describe("_notifyUploadComplete", function() {
    var mockFile, mockSettings, uploader, spy;

    beforeEach(function() {
      spy = jasmine.createSpy();
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        onComplete: spy
      };
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    it("calls the 'onComplete' callback provided via upload settings, passing in the upload location", function() {
      uploader._notifyUploadComplete('some/location');
      expect(spy).toHaveBeenCalledWith('some/location');
    });
  });

  describe("_validateFileIsReadable", function() {
    var mockFile, mockSettings, uploader, mockFileReader, spy;

    beforeEach(function() {
      mockFileReader = {
        readAsBinaryString: function() {
          this.onloadend();
        }
      };
      spy = jasmine.createSpy();
      mockFile = { name: "myfile", type: "video/quicktime", size: 1000, slice: function(start, end) { return "blob"; } };
      mockSettings = {};
      spyOn(window, 'FileReader').and.returnValue(mockFileReader);
      uploader = new BasicS3Uploader(mockFile, mockSettings);
    });

    describe("set up", function() {
      beforeEach(function() {
        spyOn(mockFile, 'slice').and.callThrough();
        spyOn(mockFileReader, 'readAsBinaryString');
      });

      it("slices the file into a 1024 byte blob", function() {
        uploader._validateFileIsReadable();
        expect(mockFile.slice).toHaveBeenCalledWith(0, 1024);
      });

      it("attempts to read a blob of the file", function() {
        uploader._validateFileIsReadable();
        expect(mockFileReader.readAsBinaryString).toHaveBeenCalledWith('blob');
      });
    });

    describe("when the file is deemed readable", function() {
      it("executes the provided callback, passing in false", function() {
        mockFileReader.error = "some error";
        uploader._validateFileIsReadable(spy);
        expect(spy).toHaveBeenCalledWith(false);
      });
    });

    describe("when the file cannot be read", function() {
      it("executes the provided callback, passing in true", function() {
        mockFileReader.error = undefined;
        uploader._validateFileIsReadable(spy);
        expect(spy).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("_ajax", function() {
    var mockFile, mockSettings, uploader, mockXHR, xhrData, successSpy, errorSpy,
      stateChangeSpy, progressSpy;

    beforeEach(function() {
      mockXHR = {
        events: {},
        uploadEvents: {},
        headers: {},
        upload: {},
        open: function(method, url) {},
        send: function(body) {},
      };

      mockXHR.addEventListener = function(event, callback, async) {
        mockXHR.events[event] = callback;
      };

      mockXHR.upload.addEventListener = function(event, callback, async) {
        mockXHR.uploadEvents[event] = callback;
      };

      mockXHR.setRequestHeader = function(header, value) {
        mockXHR.headers[header] = value;
      };

      successSpy = jasmine.createSpy();
      errorSpy = jasmine.createSpy();
      stateChangeSpy = jasmine.createSpy();
      progressSpy = jasmine.createSpy();

      mockFile = { name: "myfile", type: "video/quicktime", size: 1000 };
      mockSettings = {
        xhrRequestTimeout: 5000
      };
      spyOn(window, "XMLHttpRequest").and.returnValue(mockXHR);

      spyOn(mockXHR, 'open');
      spyOn(mockXHR, 'send');

      xhrData = {
        url: "http://www.somesite.com",
        method: "PUT",
        body: "some request body",
        params: {
          customParam1: "value1",
          customParam2: "value2",
        },
        headers: {
          header1: "value1",
          header2: "value2",
        },
        customHeaders: {
          customHeader: "customHeaderValue"
        },
        success: successSpy,
        error: errorSpy,
        stateChange: stateChangeSpy,
        progress: progressSpy
      };

      uploader = new BasicS3Uploader(mockFile, mockSettings);
      uploader._ajax(xhrData);
    });

    it("sets the entire data object on the XHR", function() {
      expect(mockXHR._data).toEqual(xhrData);
    });

    it("configures the XHR 'load' event with the provided 'success' callback", function() {
      mockXHR.events.load();
      expect(successSpy).toHaveBeenCalled();
    })

    it("configures the XHR 'error' event with the provided 'error' callback", function() {
      mockXHR.events.error();
      expect(errorSpy).toHaveBeenCalled();
    })

    it("configures the XHR 'timeout' event with the provided 'error' callback", function() {
      mockXHR.events.timeout();
      expect(errorSpy).toHaveBeenCalled();
    })

    it("configures the XHR 'readystatechange' event with the provided 'stateChange' callback", function() {
      mockXHR.events.readystatechange();
      expect(stateChangeSpy).toHaveBeenCalled();
    })

    it("configures the XHR upload 'progress' event with the provided 'progress' callback", function() {
      mockXHR.uploadEvents.progress();
      expect(progressSpy).toHaveBeenCalled();
    })

    it("opens the connection to the provided URL, including any provided query params", function() {
      var expectedURL = "http://www.somesite.com?customParam1=value1&customParam2=value2";
      expect(mockXHR.open).toHaveBeenCalledWith("PUT", expectedURL);
    });

    it("sets a timeout for the connection, using the 'xhrRequestTimeout' setting", function() {
      expect(mockXHR.timeout).toEqual(5000);
    });

    it("sets request headers", function() {
      expect(mockXHR.headers.header1).toEqual("value1");
      expect(mockXHR.headers.header2).toEqual("value2");
    });

    it("sets any custom headers", function() {
      expect(mockXHR.headers.customHeader).toEqual("customHeaderValue");
    });

    it("sends the request, providing the request body if defined", function() {
      expect(mockXHR.send).toHaveBeenCalledWith("some request body");
    });
  });

});
